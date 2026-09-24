import type { Locale } from "@/lib/i18n/config"

// Gregorian dates with month names in the visitor's language (Amharic month
// names for the Gregorian calendar, e.g. "ሴፕቴ"). The Ethiopian calendar
// itself is not used.
const INTL_LOCALE: Record<Locale, string> = { en: "en-US", am: "am-ET" }

export function formatOrderDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

export function formatOrderDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}
