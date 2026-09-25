import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_HOMEPAGE_SETTINGS,
  endOfDayInAddis,
  fillDealTokens,
  localizeHomepage,
  remainingUntil,
  sectionsFromSettings,
  settingsFromSections,
} from "@/lib/services/homepage"

afterEach(() => {
  vi.useRealTimers()
})

describe("endOfDayInAddis", () => {
  // Addis Ababa is UTC+3 all year, so its midnight is 21:00 UTC the day before.
  it("is the next midnight in Addis Ababa, expressed in UTC", () => {
    expect(endOfDayInAddis(Date.UTC(2026, 8, 24, 12, 0, 0))).toBe("2026-09-24T21:00:00.000Z") // noon UTC = 15:00 in Addis
  })

  it("rolls over to the following day once it is already past 21:00 UTC", () => {
    // 22:00 UTC is 01:00 the next day in Addis, so the next midnight there is a day later
    expect(endOfDayInAddis(Date.UTC(2026, 8, 24, 22, 0, 0))).toBe("2026-09-25T21:00:00.000Z")
  })

  it("moves to the next midnight exactly at midnight Addis time", () => {
    expect(endOfDayInAddis(Date.UTC(2026, 8, 24, 21, 0, 0))).toBe("2026-09-25T21:00:00.000Z")
    expect(endOfDayInAddis(Date.UTC(2026, 8, 24, 20, 59, 59))).toBe("2026-09-24T21:00:00.000Z")
  })

  it("is always in the future and less than a day away", () => {
    for (const hour of [0, 5, 11, 18, 20, 21, 23]) {
      const now = Date.UTC(2026, 0, 15, hour, 30, 0)
      const ms = Date.parse(endOfDayInAddis(now)) - now
      expect(ms).toBeGreaterThan(0)
      expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
    }
  })

  it("uses the current time by default", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"))
    expect(endOfDayInAddis()).toBe("2026-09-24T21:00:00.000Z")
  })
})

describe("remainingUntil", () => {
  it("counts the milliseconds left", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"))
    expect(remainingUntil("2026-09-24T12:00:10.000Z")).toBe(10_000)
  })

  it("is zero once the date has passed, or when there is no usable date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"))
    expect(remainingUntil("2026-09-24T11:00:00.000Z")).toBe(0)
    expect(remainingUntil("")).toBe(0)
    expect(remainingUntil("not a date")).toBe(0)
  })
})

describe("fillDealTokens", () => {
  it("puts the biggest discount into the promo headline and subtext", () => {
    const settings = { ...DEFAULT_HOMEPAGE_SETTINGS, promoHeadline: "Up to {maxDiscount}% Off", promoSubtext: "Save {maxDiscount}% today, {maxDiscount}!" }
    const filled = fillDealTokens(settings, 30)
    expect(filled.promoHeadline).toBe("Up to 30% Off")
    expect(filled.promoSubtext).toBe("Save 30% today, 30!")
  })

  it("leaves text without the token, and everything else, untouched", () => {
    const filled = fillDealTokens({ ...DEFAULT_HOMEPAGE_SETTINGS, promoHeadline: "Big sale" }, 30)
    expect(filled.promoHeadline).toBe("Big sale")
    expect(filled.heroHeadline).toBe(DEFAULT_HOMEPAGE_SETTINGS.heroHeadline)
  })
})

describe("localizeHomepage", () => {
  const settings = { ...DEFAULT_HOMEPAGE_SETTINGS, heroHeadline: "Hello", heroHeadlineAm: "ሰላም", heroSubtext: "Sub", heroSubtextAm: "" }

  it("shows English fields in English", () => {
    expect(localizeHomepage(settings, "en").heroHeadline).toBe("Hello")
  })

  it("shows the Amharic field in Amharic, field by field, falling back to English where it is empty", () => {
    const am = localizeHomepage(settings, "am")
    expect(am.heroHeadline).toBe("ሰላም")
    expect(am.heroSubtext).toBe("Sub") // no Amharic entered
  })
})

describe("homepage settings <-> stored sections", () => {
  it("round-trips through the two database rows", () => {
    const custom = { ...DEFAULT_HOMEPAGE_SETTINGS, heroHeadline: "A different headline", promoCtaLabelAm: "ቅናሾች" }
    expect(settingsFromSections(sectionsFromSettings(custom))).toEqual(custom)
  })

  it("falls back to the default English copy and links when the rows are missing", () => {
    const settings = settingsFromSections([])
    for (const key of ["heroHeadline", "heroSubtext", "heroCtaLabel", "heroCtaHref", "promoHeadline", "promoCtaHref"] as const) {
      expect(settings[key], key).toBe(DEFAULT_HOMEPAGE_SETTINGS[key])
    }
  })

  it("treats a missing Amharic value as 'not translated' (empty, so the page shows the English one)", () => {
    const settings = settingsFromSections([])
    expect(settings.heroHeadlineAm).toBe("")
    expect(localizeHomepage(settings, "am").heroHeadline).toBe(DEFAULT_HOMEPAGE_SETTINGS.heroHeadline)
  })

  it("reads Amharic and English values from the stored rows", () => {
    const settings = settingsFromSections([
      { section_key: "hero", content: { headline: "Hi", headline_am: "ሰላም", cta_href: "/deals" } },
      { section_key: "promo", content: { ends_at: "2026-12-31T00:00:00.000Z" } },
    ])
    expect(settings).toMatchObject({ heroHeadline: "Hi", heroHeadlineAm: "ሰላም", heroCtaHref: "/deals", promoEndsAt: "2026-12-31T00:00:00.000Z" })
  })

  it("ships a complete default set: every English text has an Amharic draft", () => {
    const d = DEFAULT_HOMEPAGE_SETTINGS
    for (const key of Object.keys(d).filter((k) => /(Headline|Subtext|CtaLabel|Eyebrow)$/.test(k))) {
      expect(d[(key + "Am") as keyof typeof d], `${key}Am`).toBeTruthy()
    }
  })

  it("never writes an empty Amharic key into a row (an empty value would hide the English fallback)", () => {
    const rows = sectionsFromSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, heroSubtextAm: "", heroHeadlineAm: "" })
    const hero = rows.find((r) => r.section_key === "hero")!
    for (const [key, value] of Object.entries(hero.content as Record<string, unknown>)) {
      if (key.endsWith("_am")) expect(value, key).not.toBe("")
    }
  })
})
