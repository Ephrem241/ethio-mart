import { describe, expect, it } from "vitest"

import { createTranslator } from "@/lib/i18n/translator"
import { listingSeo, pageMetadata, pagePath, privateMetadata, truncateDescription, withPageNumber } from "@/lib/seo/metadata"
import { en } from "@/locales/en"

const t = createTranslator("en", en)

describe("pagePath", () => {
  it("is the plain path for English", () => {
    expect(pagePath("/shop", "en")).toBe("/shop")
  })

  it("adds the language for Amharic, after the other parameters", () => {
    expect(pagePath("/shop", "am")).toBe("/shop?lang=am")
    expect(pagePath("/shop", "am", { sale: true, page: 2 })).toBe("/shop?sale=1&page=2&lang=am")
  })

  it("leaves out page 1 and a false sale flag", () => {
    expect(pagePath("/shop", "en", { sale: false, page: 1 })).toBe("/shop")
  })
})

describe("listingSeo", () => {
  it("indexes the plain listing and its numbered pages", () => {
    expect(listingSeo({}, { allowSale: true })).toEqual({ indexable: true, params: { sale: false, page: undefined } })
    expect(listingSeo({ page: "3" }, { allowSale: true }).params.page).toBe(3)
  })

  it("does not index a listing that is only a re-arrangement of the same products", () => {
    for (const raw of [{ sort: "newest" }, { category: "fashion" }, { price: "500-1000" }, { q: "wallet" }, { rating: "4" }, { stock: "1" }]) {
      expect(listingSeo(raw, { allowSale: true }).indexable, JSON.stringify(raw)).toBe(false)
    }
  })

  it("indexes the on-sale view of /shop (the Deals page) but not inside a category", () => {
    expect(listingSeo({ sale: "1" }, { allowSale: true })).toEqual({ indexable: true, params: { sale: true, page: undefined } })
    expect(listingSeo({ sale: "1" }, { allowSale: false }).indexable).toBe(false)
  })

  it("ignores an invalid page number", () => {
    expect(listingSeo({ page: "abc" }, { allowSale: true }).params.page).toBeUndefined()
    expect(listingSeo({ page: "0" }, { allowSale: true }).params.page).toBeUndefined()
  })
})

describe("withPageNumber", () => {
  it("makes numbered pages distinguishable in the title", () => {
    expect(withPageNumber("Shop", 2, t)).toBe(`Shop — ${en.catalog.pageLabel.replace("{page}", "2")}`)
  })

  it("leaves page 1 and no page alone", () => {
    expect(withPageNumber("Shop", 1, t)).toBe("Shop")
    expect(withPageNumber("Shop", undefined, t)).toBe("Shop")
  })
})

describe("truncateDescription", () => {
  it("leaves a short text alone, tidying whitespace", () => {
    expect(truncateDescription("  A   short\ntext.  ")).toBe("A short text.")
  })

  it("cuts a long text at a word boundary, within the limit, with an ellipsis", () => {
    const long = "word ".repeat(80)
    const cut = truncateDescription(long, 60)
    expect(cut.length).toBeLessThanOrEqual(60)
    expect(cut.endsWith("…")).toBe(true)
    expect(cut).not.toMatch(/wor…$/) // never mid-word
  })

  it("does not leave dangling punctuation before the ellipsis", () => {
    const cut = truncateDescription("First part, second part, third part, fourth part, fifth part.", 30)
    expect(cut).not.toMatch(/[,;:.\-–—]\s*…$/)
  })

  it("cuts a single very long word at the limit", () => {
    const cut = truncateDescription("x".repeat(500), 100)
    expect(cut.length).toBe(100)
    expect(cut.endsWith("…")).toBe(true)
  })
})

describe("pageMetadata", () => {
  const base = { locale: "en" as const, path: "/product/wallet", title: "Leather Wallet", description: "A slim wallet." }

  it("points the canonical at the page itself and declares both languages", () => {
    const meta = pageMetadata(base)
    expect(meta.alternates?.canonical).toBe("/product/wallet")
    expect(meta.alternates?.languages).toEqual({
      en: "/product/wallet",
      am: "/product/wallet?lang=am",
      "x-default": "/product/wallet",
    })
  })

  it("keeps the language in the canonical for the Amharic page", () => {
    expect(pageMetadata({ ...base, locale: "am" }).alternates?.canonical).toBe("/product/wallet?lang=am")
  })

  it("always states a share image, the site's own when the page has none", () => {
    const own = pageMetadata({ ...base, image: { url: "https://cdn.example/wallet.jpg", alt: "Wallet" } })
    expect((own.openGraph?.images as { url: string }[])[0].url).toBe("https://cdn.example/wallet.jpg")
    const fallback = pageMetadata(base)
    expect((fallback.openGraph?.images as { url: string }[])[0].url).toMatch(/\/opengraph-image$/)
    expect(fallback.twitter?.images).toHaveLength(1)
  })

  it("hides an unindexable page and points its canonical at the plain listing", () => {
    const meta = pageMetadata({ ...base, path: "/shop", indexable: false, listing: { page: 4 } })
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect(meta.alternates?.canonical).toBe("/shop")
  })

  it("leaves an indexable page without a robots restriction", () => {
    expect(pageMetadata(base).robots).toBeUndefined()
  })

  it("marks the language on the social card, with the other one as alternate", () => {
    const meta = pageMetadata({ ...base, locale: "am" })
    expect(meta.openGraph).toMatchObject({ locale: "am_ET", alternateLocale: ["en_US"] })
  })

  it("uses the social title for previews when one is given", () => {
    const meta = pageMetadata({ ...base, socialTitle: "Welcome" })
    expect(meta.openGraph?.title).toBe("Welcome")
  })
})

describe("privateMetadata", () => {
  it("keeps personal pages out of search results and stops crawlers following their links", () => {
    expect(privateMetadata("Your cart")).toEqual({ title: "Your cart", robots: { index: false, follow: false } })
  })
})
