"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { cn } from "cn"

import { LOCALES, LOCALE_NAMES, LOCALE_PARAM, type Locale } from "@/lib/i18n/config"
import { setLocale } from "@/lib/i18n/actions"
import { useT } from "@/lib/i18n/provider"

// Two-option segmented control. `labels="short"` (EN | አማ) fits the headers;
// `labels="full"` (English | አማርኛ) is for the footer. Each option is written
// in its own language and script so it can be found without reading the
// current one.
//
// `compact` (the phone header, where every pixel counts) is instead ONE button
// that names the OTHER language ("አማ" while reading English, "EN" while reading
// Amharic) and switches to it — about half the width of the two-option control.
function LanguageSwitcher({
  className,
  labels = "short",
  compact = false,
  tone = "light",
}: {
  className?: string
  labels?: "short" | "full"
  /** A single "switch to the other language" button — for the narrow phone header. */
  compact?: boolean
  /** "dark" is for the forest footer. */
  tone?: "light" | "dark"
}) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const dark = tone === "dark"

  function choose(locale: Locale) {
    if (locale === t.locale) return
    startTransition(async () => {
      await setLocale(locale)
      // A `?lang=` in the address would override the cookie we just set, so
      // drop it; otherwise refresh the page in place.
      const url = new URL(window.location.href)
      if (url.searchParams.has(LOCALE_PARAM)) {
        url.searchParams.delete(LOCALE_PARAM)
        router.replace(`${url.pathname}${url.search}`)
      } else {
        router.refresh()
      }
    })
  }

  if (compact) {
    const other = LOCALES.find((locale) => locale !== t.locale) ?? t.locale
    return (
      <button
        type="button"
        lang={other}
        disabled={pending}
        onClick={() => choose(other)}
        // Named in its own language: the button says which language it switches TO.
        aria-label={LOCALE_NAMES[other].native}
        className={cn(
          "inline-flex h-9 min-w-10 items-center justify-center rounded-full border border-border bg-card px-3 text-xs font-medium text-charcoal transition-colors hover:bg-cream focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          other === "am" && "font-ethiopic-system",
          pending && "opacity-70",
          className
        )}
      >
        {LOCALE_NAMES[other].short}
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border p-0.5",
        dark ? "border-white/20 bg-white/5" : "border-border bg-card",
        pending && "opacity-70",
        className
      )}
    >
      <Globe aria-hidden className={cn("mx-1.5 size-3.5", dark ? "text-white/60" : "text-muted-text")} />
      {LOCALES.map((locale) => {
        const active = locale === t.locale
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={active}
            disabled={pending}
            onClick={() => choose(locale)}
            className={cn(
              "min-h-8 rounded-full px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              // Ethiopic label: system font, so it doesn't pull in the web font (see globals.css).
              locale === "am" && "font-ethiopic-system",
              dark
                ? active
                  ? "bg-gold text-forest-dark"
                  : "text-white/80 hover:bg-white/10"
                : active
                  ? "bg-forest text-white"
                  : "text-charcoal hover:bg-cream"
            )}
          >
            {labels === "full" ? LOCALE_NAMES[locale].native : LOCALE_NAMES[locale].short}
          </button>
        )
      })}
    </div>
  )
}

export { LanguageSwitcher }
