"use client"

import { CardListSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { useState } from "react"
import { CornerUpLeft, Mail } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { useContactMessages } from "@/lib/hooks/use-admin-data"
import { formatOrderDate } from "@/lib/date"
import { EmptyState } from "@/components/feedback/empty-state"

type Filter = "all" | "unread"

// The inbox: newest first, unread ones in bold with a dot. Each row opens the
// message, which marks it read.
function AdminMessagesContent() {
  const t = useT()
  const { data: messages, loading } = useContactMessages()
  const [filter, setFilter] = useState<Filter>("all")

  if (loading) return <CardListSkeleton />

  if (!messages) {
    return <p className="text-sm text-error">{t("admin.loadFailed.messages")}</p>
  }

  if (messages.length === 0) {
    return <EmptyState icon={Mail} title={t("admin.messages.empty")} />
  }

  const unreadCount = messages.filter((m) => !m.readAt).length
  const shown = filter === "unread" ? messages.filter((m) => !m.readAt) : messages

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t("admin.messages.filterLabel")} className="flex gap-2">
        {(["all", "unread"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              filter === value
                ? "border-forest bg-forest text-white"
                : "border-input bg-card text-charcoal hover:bg-cream"
            )}
          >
            {value === "all" ? t("admin.messages.filterAll") : t("admin.messages.filterUnread")}
            {value === "unread" && unreadCount > 0 && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Mail} title={t("admin.messages.emptyUnread")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card">
          {shown.map((message) => {
            const unread = !message.readAt
            return (
              <li key={message.id}>
                <Link
                  href={`/admin/messages/${message.id}`}
                  className="flex gap-3 p-4 outline-none transition-colors hover:bg-cream/70 focus-visible:bg-cream focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden
                    className={cn("mt-2 size-2 shrink-0 rounded-full", unread ? "bg-forest" : "bg-transparent")}
                  />
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate text-charcoal", unread ? "font-semibold" : "font-medium")}>
                        {message.name}
                        {unread && <span className="sr-only"> ({t("admin.messages.unread")})</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted-text">
                        {formatOrderDate(message.createdAt, t.locale)}
                      </span>
                    </span>
                    <span className={cn("block truncate text-sm text-charcoal", unread && "font-medium")}>
                      {message.subject ?? t("admin.messages.noSubject")}
                    </span>
                    <span className="block truncate text-sm text-muted-text">{message.message}</span>
                    {message.replies.length > 0 && (
                      <span className="flex items-center gap-1 pt-1 text-xs text-forest">
                        <CornerUpLeft aria-hidden className="size-3.5" />
                        {t("admin.messages.replied")}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { AdminMessagesContent }
