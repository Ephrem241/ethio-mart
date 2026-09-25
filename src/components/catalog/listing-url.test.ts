import { describe, expect, it } from "vitest"

import { buildFilterUrl, buildPageUrl, buildSortUrl } from "@/components/catalog/listing-url"

// Changing a filter or the sort changes what is on every page, so it always
// goes back to page 1. Everything else in the address (a search, the other
// setting) must survive.
describe("buildFilterUrl", () => {
  it("writes each chosen filter into the query string", () => {
    const url = buildFilterUrl("/shop", {}, { categorySlug: "fashion", priceBucket: "500-1000", inStockOnly: true, minRating: 4.5, onSaleOnly: true })
    const params = new URL(url, "http://x").searchParams
    expect(params.get("category")).toBe("fashion")
    expect(params.get("price")).toBe("500-1000")
    expect(params.get("stock")).toBe("1")
    expect(params.get("rating")).toBe("4.5")
    expect(params.get("sale")).toBe("1")
  })

  it("returns the bare path when no filter is chosen", () => {
    expect(buildFilterUrl("/shop", {}, {})).toBe("/shop")
  })

  it("replaces the old filters, keeping the search and the sort", () => {
    const url = buildFilterUrl("/shop", { q: "leather", sort: "newest", category: "kitchen", price: "under-500" }, { categorySlug: "fashion" })
    const params = new URL(url, "http://x").searchParams
    expect(params.get("category")).toBe("fashion")
    expect(params.get("q")).toBe("leather")
    expect(params.get("sort")).toBe("newest")
    expect(params.has("price")).toBe(false) // it was not part of the new choice
  })

  it("goes back to page 1", () => {
    expect(buildFilterUrl("/shop", { page: "3" }, { onSaleOnly: true })).toBe("/shop?sale=1")
  })

  it("escapes what it writes", () => {
    expect(buildFilterUrl("/shop", { q: "a&b c" }, {})).toBe("/shop?q=a%26b+c")
  })

  it("keeps a repeated parameter's values", () => {
    expect(buildFilterUrl("/shop", { tag: ["a", "b"] }, {})).toBe("/shop?tag=a&tag=b")
  })

  it("skips parameters with no value", () => {
    expect(buildFilterUrl("/shop", { q: undefined }, {})).toBe("/shop")
  })
})

describe("buildSortUrl", () => {
  it("adds a sort, and drops it for the default 'recommended'", () => {
    expect(buildSortUrl("/shop", {}, "price-asc")).toBe("/shop?sort=price-asc")
    expect(buildSortUrl("/shop", { sort: "price-asc" }, "recommended")).toBe("/shop")
  })

  it("keeps the filters and goes back to page 1", () => {
    expect(buildSortUrl("/category/fashion", { sale: "1", page: "4", sort: "newest" }, "price-desc")).toBe("/category/fashion?sale=1&sort=price-desc")
  })
})

describe("buildPageUrl", () => {
  it("sets the page from 2 up, and leaves page 1 as the plain listing", () => {
    expect(buildPageUrl("/shop", {}, 2)).toBe("/shop?page=2")
    expect(buildPageUrl("/shop", { page: "2" }, 1)).toBe("/shop")
  })

  it("keeps every filter", () => {
    expect(buildPageUrl("/search", { q: "wallet", sort: "newest" }, 3)).toBe("/search?q=wallet&sort=newest&page=3")
  })
})
