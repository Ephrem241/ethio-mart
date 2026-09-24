import { cookies, headers } from "next/headers"

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, type Locale } from "@/lib/i18n/config"
import { createTranslator, type Translator } from "@/lib/i18n/translator"
import type { Dictionary } from "@/locales/en"

// Server-only: reads the visitor's language from the cookie (set by the
// switcher) and loads that dictionary. Reading the cookie makes every page
// render per request — they already do, since the catalog is read live.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/locales/en").then((m) => m.en),
  am: () => import("@/locales/am").then((m) => m.am),
}

// Order: an explicit `?lang=` on this request (put in a header by the proxy),
// then the visitor's cookie, then English. The header only ever changes the
// language of the response the sender receives, so it needs no trust.
export async function getLocale(): Promise<Locale> {
  const requested = (await headers()).get(LOCALE_HEADER)
  if (isLocale(requested)) return requested
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(stored) ? stored : DEFAULT_LOCALE
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]()
}

// `const t = await getT()` in any Server Component or generateMetadata.
export async function getT(): Promise<Translator> {
  const locale = await getLocale()
  return createTranslator(locale, await getDictionary(locale))
}
