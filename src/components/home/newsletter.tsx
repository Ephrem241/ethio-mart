"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { subscribeToNewsletter } from "@/lib/services/newsletter"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// The same shape check the database applies (see subscribe_to_newsletter). A
// single email field doesn't need a form library and a schema library — those
// would add ~100KB of JavaScript to the home page for it.
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function Newsletter() {
  const t = useT()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = email.trim()
    if (!EMAIL_SHAPE.test(value)) {
      setError(t("validation.email"))
      return
    }
    setError(undefined)
    setSubmitting(true)
    const result = await subscribeToNewsletter(value)
    setSubmitting(false)
    if (result.success) {
      toast.success(t("home.newsletter.success"))
      setEmail("")
    } else {
      toast.error(result.error)
    }
  }

  // Lives in the dark footer (its heading and blurb are rendered by the footer
  // itself): a light input beside a gold button.
  return (
    // method="post": if someone submits before this component has hydrated, the
    // browser's own submit must not put the address in the URL (a GET would).
    <form method="post" onSubmit={handleSubmit} noValidate className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("home.newsletter.emailPlaceholder")}
          aria-label={t("home.newsletter.emailLabel")}
          aria-invalid={!!error}
          aria-describedby={error ? "newsletter-error" : undefined}
          className="h-11 min-w-0 flex-1 border-transparent bg-white text-charcoal placeholder:text-muted-text"
        />
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 bg-gold px-5 text-forest-dark hover:bg-[color-mix(in_srgb,var(--color-gold),white_18%)]"
        >
          {t("home.newsletter.subscribe")}
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </form>
  )
}

export { Newsletter }
