"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { Locale } from "@/lib/i18n/config"
import { setActiveTranslator } from "@/lib/i18n/translate"
import { createTranslator, type Translator } from "@/lib/i18n/translator"
import type { Dictionary } from "@/locales/en"

const TranslatorContext = createContext<Translator | null>(null)

// The root layout (a Server Component) reads the cookie and passes ONLY the
// active language's dictionary down, so visitors never download the other one.
export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale
  dictionary: Dictionary
  children: ReactNode
}) {
  const translator = useMemo(() => createTranslator(locale, dictionary), [locale, dictionary])

  // For translate() in non-React code (see translate.ts). Assigned during
  // render on purpose: it is idempotent (a pure function of the props) and
  // must already be in place when the first event handler or validation runs,
  // which an effect can't guarantee — child effects fire before this one.
  setActiveTranslator(translator)

  return <TranslatorContext value={translator}>{children}</TranslatorContext>
}

// `const t = useT()` in any Client Component; `t.locale` is the language code.
export function useT(): Translator {
  const translator = useContext(TranslatorContext)
  if (!translator) throw new Error("useT must be used inside <LocaleProvider>.") // i18n-ignore: developer-facing
  return translator
}
