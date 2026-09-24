// Supported languages and the cookie that remembers the visitor's choice.
// Routes are NOT locale-prefixed (/am/...): the spec only asks that the
// selection persists, and prefixing would touch every route, redirect and
// auth callback. The trade-off (search engines index one language per URL)
// is handled with a `?lang=` link (see LOCALE_PARAM below and lib/seo).
export const LOCALES = ["en", "am"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"
export const LOCALE_COOKIE = "locale"
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // one year

// `?lang=am` on a public page shows that page in Amharic — the only way a
// crawler (which sends no cookies) or a shared link can ask for a language.
// src/proxy.ts turns the parameter into a request header for that request and
// also stores it in the cookie, so following links keeps the language.
export const LOCALE_PARAM = "lang"
export const LOCALE_HEADER = "x-locale"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

// Each language names itself in its own script, as language pickers should:
// someone who can't read the current language must still find their own.
export const LOCALE_NAMES: Record<Locale, { native: string; short: string }> = {
  en: { native: "English", short: "EN" },
  am: { native: "አማርኛ", short: "አማ" },
}
