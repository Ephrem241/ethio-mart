import { describe, expect, it } from "vitest"

import { breadcrumbJsonLd, collectionJsonLd, organizationJsonLd, productJsonLd, websiteJsonLd } from "@/lib/seo/json-ld"
import { absoluteUrl, isIndexableDeployment } from "@/lib/seo/site"
import { makeProduct } from "@/test/factories"

describe("absoluteUrl", () => {
  it("makes a path absolute", () => {
    expect(absoluteUrl("/product/x")).toMatch(/^https?:\/\/.+\/product\/x$/)
    expect(absoluteUrl("product/x")).toMatch(/^https?:\/\/.+\/product\/x$/)
  })

  it("leaves an already-absolute URL alone", () => {
    expect(absoluteUrl("https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg")
    expect(absoluteUrl("HTTP://cdn.example/a.jpg")).toBe("HTTP://cdn.example/a.jpg")
  })
})

describe("isIndexableDeployment", () => {
  it("lets production and non-Vercel hosts be crawled but not previews", () => {
    const before = process.env.VERCEL_ENV
    try {
      delete process.env.VERCEL_ENV
      expect(isIndexableDeployment()).toBe(true)
      process.env.VERCEL_ENV = "production"
      expect(isIndexableDeployment()).toBe(true)
      process.env.VERCEL_ENV = "preview"
      expect(isIndexableDeployment()).toBe(false)
    } finally {
      if (before === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = before
    }
  })
})

describe("structured data", () => {
  it("describes the organization and the website, linked by @id", () => {
    const org = organizationJsonLd("Everyday goods.")
    const site = websiteJsonLd("en")
    expect(org["@type"]).toBe("Organization")
    expect(site["@type"]).toBe("WebSite")
    expect(site.publisher).toEqual({ "@id": org["@id"] })
    expect(site.inLanguage).toBe("en")
  })

  it("describes the header search box as a SearchAction pointing at /search", () => {
    const action = websiteJsonLd("en").potentialAction as { target: { urlTemplate: string } }
    expect(action.target.urlTemplate).toMatch(/\/search\?q=\{search_term_string\}$/)
  })

  it("numbers breadcrumb items from 1 and makes their URLs absolute", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Fashion", url: "/category/fashion" },
    ])
    const items = crumbs.itemListElement as { position: number; name: string; item: string }[]
    expect(items.map((i) => i.position)).toEqual([1, 2])
    expect(items[1].item).toMatch(/^https?:\/\/.+\/category\/fashion$/)
  })

  it("describes a collection page", () => {
    expect(collectionJsonLd({ name: "Shop", description: "All products", url: "/shop", inLanguage: "am" })).toMatchObject({
      "@type": "CollectionPage",
      name: "Shop",
      inLanguage: "am",
    })
  })
})

describe("productJsonLd", () => {
  const input = (overrides = {}) => ({
    product: makeProduct({ sku: "FAS-001", price: 580, stock: 31, image_url: "/images/wallet.jpg", ...overrides }),
    name: "Leather Wallet",
    description: "A slim wallet.",
    url: "/product/leather-wallet",
    categoryName: "Fashion",
  })

  it("states the price in birr as text, with an absolute product URL", () => {
    const node = productJsonLd(input())
    expect(node["@type"]).toBe("Product")
    expect(node.sku).toBe("FAS-001")
    expect(node.offers).toMatchObject({ priceCurrency: "ETB", price: "580" })
    expect((node.offers as { url: string }).url).toMatch(/^https?:\/\/.+\/product\/leather-wallet$/)
  })

  it("says in stock or out of stock from the real stock level", () => {
    expect((productJsonLd(input()).offers as { availability: string }).availability).toBe("https://schema.org/InStock")
    expect((productJsonLd(input({ stock: 0 })).offers as { availability: string }).availability).toBe("https://schema.org/OutOfStock")
  })

  it("includes the image only when there is one, made absolute", () => {
    expect(productJsonLd(input()).image).toEqual([expect.stringMatching(/^https?:\/\/.+\/images\/wallet\.jpg$/)])
    expect("image" in productJsonLd(input({ image_url: null }))).toBe(false)
  })

  it("never claims a rating (there are no real reviews behind the seeded numbers)", () => {
    expect("aggregateRating" in productJsonLd(input({ rating: 4.6 }))).toBe(false)
  })
})
