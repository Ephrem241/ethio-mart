"use server"

import { cookies } from "next/headers"

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "@/lib/i18n/config"

// Called by the language switcher. Setting the cookie inside a Server Action
// makes Next discard its cached pages and re-render the current one, so
// every page — visited or prefetched — comes back in the new language.
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  })
}
