import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import type { MessageKey, MessageParams, Translator } from "@/lib/i18n/translator"

// Code that runs outside React's render — service functions returning error
// text, zod validation messages, store actions — still has to speak the
// visitor's language. `LocaleProvider` registers the active translator here
// on every render, and `translate` reads it when the message is needed (in an
// event handler or a validation run, never at module load).
//
// Browser-only by design. On the server the locale belongs to a request, and
// concurrent requests would trample module state — so registration is a no-op
// there, `translate` returns the bare key, and anything rendered on the server
// (including server-rendering of client components) must use `useT()` /
// `getT()` instead. Only call `translate` from event handlers, validation
// runs and service functions, never while rendering.
let active: Translator | null = null

export function setActiveTranslator(translator: Translator) {
  if (typeof window === "undefined") return
  active = translator
}

// The language the page is currently shown in (English until the provider
// has registered). For service code that must pick a product's name in the
// right language.
export function getActiveLocale(): Locale {
  return active?.locale ?? DEFAULT_LOCALE
}

export function translate(key: MessageKey, params?: MessageParams): string {
  return active ? active(key, params) : key
}

export function translatePlural(
  key: Parameters<Translator["plural"]>[0],
  count: number,
  params?: MessageParams
): string {
  return active ? active.plural(key, count, params) : key
}
