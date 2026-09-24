import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/locales/en"

// Pure and isomorphic: builds a translator from a dictionary. No cookies, no
// React — the server (getT) and the browser (LocaleProvider) both use it.

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

// Paths to objects shaped { one, other } — the plural forms of a message.
type PluralBases<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends { one: string; other: string }
      ? `${P}${K}`
      : PluralBases<T[K], `${P}${K}.`>
}[keyof T & string]

export type MessageKey = Leaves<Dictionary>
export type PluralKey = PluralBases<Dictionary>
export type MessageParams = Record<string, string | number>

export interface Translator {
  (key: MessageKey, params?: MessageParams): string
  // Picks `<key>.one` for a count of exactly 1 and `<key>.other` otherwise;
  // `{count}` is filled in automatically.
  plural: (key: PluralKey, count: number, params?: MessageParams) => string
  locale: Locale
}

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict
  for (const part of key.split(".")) {
    if (node == null || typeof node !== "object") return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === "string" ? node : undefined
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole
  )
}

export function createTranslator(locale: Locale, dict: Dictionary): Translator {
  const t = ((key: string, params?: MessageParams) => {
    const message = lookup(dict, key)
    if (message === undefined) {
      // A missing key is a bug the type-checker normally prevents; show the
      // key rather than an empty hole in the page.
      return key
    }
    return interpolate(message, params)
  }) as Translator

  t.plural = (key, count, params) =>
    t(`${key}.${count === 1 ? "one" : "other"}` as MessageKey, { count, ...params })
  t.locale = locale
  return t
}
