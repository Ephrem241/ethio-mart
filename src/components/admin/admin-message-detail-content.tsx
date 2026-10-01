"use client"

import { OrderDetailSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, MailX, MailOpen, Trash2 } from "lucide-react"

import { BRAND_NAME } from "@/lib/brand"
import { useT } from "@/lib/i18n/provider"
import { useContactMessage } from "@/lib/hooks/use-admin-data"
import { deleteMessage, replyToMessage, setMessageRead } from "@/lib/services/admin-messages"
import { formatOrderDateTime } from "@/lib/date"
import { replySchema, type ReplyValues } from "@/components/admin/reply-schema"
import { EmptyState } from "@/components/feedback/empty-state"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// One customer message: the text, the admin's earlier replies, and a reply
// box. Opening it marks it read. A reply is emailed to the customer (with the
// shop's address as Reply-To, so their answer reaches the shop's inbox).
function AdminMessageDetailContent({ messageId }: { messageId: string }) {
  const t = useT()
  const router = useRouter()
  const { data: message, loading, reload } = useContactMessage(messageId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const markedRead = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyValues>({ resolver: zodResolver(replySchema), defaultValues: { body: "" } })

  const unread = message ? !message.readAt : false
  useEffect(() => {
    if (!unread || markedRead.current) return
    markedRead.current = true
    void setMessageRead(messageId, true)
  }, [unread, messageId])

  if (loading) return <OrderDetailSkeleton />

  if (!message) {
    return (
      <EmptyState
        titleAs="h1"
        icon={MailX}
        title={t("admin.messages.notFound")}
        action={
          <Button asChild>
            <Link href="/admin/messages">{t("admin.messages.backToMessages")}</Link>
          </Button>
        }
      />
    )
  }

  const { email } = message
  const language = message.locale === "am" ? t("admin.messages.languageAm") : t("admin.messages.languageEn")

  async function onReply(values: ReplyValues) {
    const result = await replyToMessage(messageId, values.body)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(t("admin.messages.sent", { email }))
    reset({ body: "" })
    reload()
  }

  async function handleMarkUnread() {
    const result = await setMessageRead(messageId, false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(t("admin.messages.markedUnread"))
    router.push("/admin/messages")
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteMessage(messageId)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setConfirmDelete(false)
    toast.success(t("admin.messages.deleted"))
    router.push("/admin/messages")
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/messages"
        className="inline-flex items-center gap-1 text-sm text-forest underline underline-offset-4 hover:no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("admin.messages.backToMessages")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-xl font-semibold text-charcoal">
            {message.subject ?? t("admin.messages.noSubject")}
          </h1>
          <p className="text-sm text-muted-text">
            {t("admin.messages.received", { date: formatOrderDateTime(message.createdAt, t.locale) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkUnread}>
            <MailOpen aria-hidden className="size-4" />
            {t("admin.messages.markUnread")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden className="size-4" />
            {t("admin.messages.delete")}
          </Button>
        </div>
      </div>

      <section aria-labelledby="message-from" className="space-y-3 rounded-card border border-border bg-card p-5">
        <div className="space-y-0.5 text-sm">
          <h2 id="message-from" className="font-medium text-charcoal">
            {t("admin.messages.from", { name: message.name })}
          </h2>
          <p>
            <a href={`mailto:${message.email}`} className="break-all text-forest underline underline-offset-4 hover:no-underline">
              {message.email}
            </a>
          </p>
          <p className="text-muted-text">{t("admin.messages.language", { language })}</p>
        </div>
        <p className="whitespace-pre-wrap break-words leading-relaxed text-charcoal">{message.message}</p>
      </section>

      {message.replies.length > 0 && (
        <section aria-labelledby="message-replies" className="space-y-3">
          <h2 id="message-replies" className="font-medium text-charcoal">
            {t("admin.messages.replies")}
          </h2>
          <ol className="space-y-3">
            {message.replies.map((reply) => (
              <li key={reply.id} className="space-y-2 rounded-card border border-border bg-cream/60 p-4">
                <p className="text-xs text-muted-text">
                  {t("admin.messages.repliedBy", {
                    name: reply.adminName ?? BRAND_NAME,
                    date: formatOrderDateTime(reply.createdAt, t.locale),
                  })}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal">{reply.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="reply-title" className="space-y-3 rounded-card border border-border bg-card p-5">
        <h2 id="reply-title" className="font-medium text-charcoal">
          {t("admin.messages.reply")}
        </h2>
        <p className="text-sm text-muted-text">{t("admin.messages.replyHint", { email: message.email, language })}</p>
        <form onSubmit={handleSubmit(onReply)} noValidate className="space-y-3">
          <FormField
            id="reply-body"
            required
            multiline
            rows={6}
            label={t("admin.messages.replyLabel", { name: message.name })}
            registration={register("body")}
            error={errors.body?.message}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("admin.messages.sending") : t("admin.messages.send")}
          </Button>
        </form>
      </section>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.messages.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("admin.messages.deleteText", { name: message.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AdminMessageDetailContent }
