import { describe, expect, it } from "vitest"

import { formatNumber, formatPrice } from "@/lib/currency"
import { createTranslator } from "@/lib/i18n/translator"
import { am } from "@/locales/am"
import { en } from "@/locales/en"

describe("formatNumber", () => {
  it("uses Western digits with thousands separators and no decimals", () => {
    expect(formatNumber(0)).toBe("0")
    expect(formatNumber(580)).toBe("580")
    expect(formatNumber(1850)).toBe("1,850")
    expect(formatNumber(1234567)).toBe("1,234,567")
  })

  it("rounds instead of showing fractions", () => {
    expect(formatNumber(99.4)).toBe("99")
    expect(formatNumber(99.6)).toBe("100")
  })
})

describe("formatPrice", () => {
  it("puts the amount into the language's money pattern", () => {
    const tEn = createTranslator("en", en)
    const tAm = createTranslator("am", am)
    expect(formatPrice(1850, tEn)).toBe(en.common.money.replace("{amount}", "1,850"))
    expect(formatPrice(1850, tAm)).toBe(am.common.money.replace("{amount}", "1,850"))
  })

  it("keeps the digits identical in both languages", () => {
    const tAm = createTranslator("am", am)
    expect(formatPrice(2000, tAm)).toContain("2,000")
  })
})
