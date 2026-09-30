"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2 } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { submitContactMessage } from "@/lib/services/contact"
import { contactSchema, type ContactValues } from "@/components/contact/contact-schema"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const EMPTY: ContactValues = { name: "", email: "", subject: "", message: "", website: "" }

// The Contact page's message form. The message is emailed to the shop (with
// Reply-To set to the sender) and kept in the database; see
// lib/services/contact.ts. After sending, the form gives way to a
// confirmation, which takes focus so a screen reader announces it.
function ContactForm() {
  const t = useT()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const confirmationRef = useRef<HTMLHeadingElement>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (sentTo !== null) confirmationRef.current?.focus()
  }, [sentTo])

  async function onSubmit({ website, ...values }: ContactValues) {
    setError(null)
    // Only robots fill in the hidden field: look successful, send nothing.
    if (website) {
      setSentTo(values.name)
      return
    }
    const result = await submitContactMessage(values, t.locale)
    if (!result.success) {
      setError(result.error)
      return
    }
    setSentTo(values.name)
  }

  if (sentTo !== null) {
    return (
      <div className="space-y-4 rounded-card border border-border bg-white p-5 sm:p-7" role="status">
        <h2
          ref={confirmationRef}
          tabIndex={-1}
          className="flex items-center gap-2 text-lg font-semibold text-charcoal outline-none"
        >
          <CheckCircle2 aria-hidden className="size-5 text-success" />
          {t("contactForm.sentTitle")}
        </h2>
        <p className="leading-relaxed text-charcoal">{t("contactForm.sent", { name: sentTo })}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset(EMPTY)
            setSentTo(null)
          }}
        >
          {t("contactForm.sendAnother")}
        </Button>
      </div>
    )
  }

  return (
    <section aria-labelledby="contact-form-title" className="space-y-4 rounded-card border border-border bg-white p-5 sm:p-7">
      <div className="space-y-1">
        <h2 id="contact-form-title" className="text-lg font-semibold text-charcoal">
          {t("contactForm.title")}
        </h2>
        <p className="text-sm text-muted-text">{t("contactForm.intro")}</p>
      </div>
      {/* method="post": a submit before hydration must not put the message in the URL. */}
      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="contact-name"
            required
            label={t("contactForm.name")}
            autoComplete="name"
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormField
            id="contact-email"
            required
            type="email"
            label={t("contactForm.email")}
            autoComplete="email"
            registration={register("email")}
            error={errors.email?.message}
          />
        </div>
        <FormField
          id="contact-subject"
          label={t("contactForm.subject")}
          registration={register("subject")}
          error={errors.subject?.message}
        />
        <FormField
          id="contact-message"
          required
          multiline
          rows={6}
          label={t("contactForm.message")}
          registration={register("message")}
          error={errors.message?.message}
        />
        {/* The honeypot: off-screen and out of the tab order, hidden from assistive technology. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">{t("contactForm.honeypot")}</label>
          <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("contactForm.sending") : t("contactForm.send")}
        </Button>
      </form>
    </section>
  )
}

export { ContactForm }
