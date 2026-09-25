import { describe, expect, it } from "vitest"

import { createTranslator } from "@/lib/i18n/translator"
import { am } from "@/locales/am"
import { en } from "@/locales/en"

const tEn = createTranslator("en", en)
const tAm = createTranslator("am", am)

describe("createTranslator", () => {
  it("looks a message up by its dotted path", () => {
    expect(tEn("common.somethingWentWrong")).toBe(en.common.somethingWentWrong)
    expect(tAm("common.somethingWentWrong")).toBe(am.common.somethingWentWrong)
  })

  it("carries the language it speaks", () => {
    expect(tEn.locale).toBe("en")
    expect(tAm.locale).toBe("am")
  })

  it("fills {placeholders} from the parameters, numbers included", () => {
    expect(tEn("catalog.results", { start: 1, end: 12, total: 32 })).toBe("Showing 1–12 of 32 results")
    expect(tEn("common.money", { amount: "1,850" })).toBe("1,850 ETB")
  })

  it("leaves a placeholder visible when its parameter is missing, instead of printing 'undefined'", () => {
    expect(tEn("common.money")).toBe("{amount} ETB")
    expect(tEn("common.money", { other: 1 })).toBe("{amount} ETB")
  })

  it("uses every occurrence of a placeholder", () => {
    // no dictionary message repeats one, so build a tiny dictionary around the real translator
    const t = createTranslator("en", { ...en, common: { ...en.common, money: "{amount} — {amount}" } })
    expect(t("common.money", { amount: 5 })).toBe("5 — 5")
  })

  it("returns the key itself for a message that does not exist, rather than an empty hole", () => {
    // deliberately wrong: the type system normally makes this impossible
    expect(tEn("no.such.key" as never)).toBe("no.such.key")
  })

  it("returns the key when the path points at a group, not a message", () => {
    expect(tEn("common" as never)).toBe("common")
  })
})

describe("plural messages", () => {
  it("uses the singular form for exactly one", () => {
    expect(tEn.plural("nav.cartCount", 1)).toBe("Cart, 1 item")
  })

  it("uses the plural form for zero and for many", () => {
    expect(tEn.plural("nav.cartCount", 0)).toBe("Cart, 0 items")
    expect(tEn.plural("nav.cartCount", 2)).toBe("Cart, 2 items")
    expect(tEn.plural("nav.cartCount", 12)).toBe("Cart, 12 items")
  })

  it("fills {count} itself and still accepts extra parameters", () => {
    expect(tEn.plural("nav.cartCount", 3, { unused: "x" })).toBe("Cart, 3 items")
  })

  it("works in Amharic too", () => {
    expect(tAm.plural("nav.cartCount", 1)).toContain("1")
    expect(tAm.plural("nav.cartCount", 4)).toContain("4")
    expect(tAm.plural("nav.cartCount", 1)).not.toBe(tAm.plural("nav.cartCount", 4))
  })
})
