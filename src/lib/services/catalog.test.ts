import { describe, expect, it } from "vitest"

import { createTranslator } from "@/lib/i18n/translator"
import {
  PRICE_BUCKETS,
  RATING_THRESHOLDS,
  computeFilterFacets,
  getStockStatus,
  isOnSale,
  listCategoriesWithCount,
  listProducts,
  parseListingParams,
  pickFeatured,
  pickFlashDeals,
  pickPopular,
  priceBucketLabel,
  toProduct,
  withCategory,
  type ProductRow,
} from "@/lib/services/catalog"
import { am } from "@/locales/am"
import { en } from "@/locales/en"
import { makeCategory, makeProduct } from "@/test/factories"

const t = createTranslator("en", en)
const tAm = createTranslator("am", am)

// A small shop: two categories, eight products chosen so that every filter has something to include and exclude.
const fashion = makeCategory({ id: "fashion", slug: "fashion", name_en: "Fashion", name_am: "ፋሽን", sort_order: 1 })
const kitchen = makeCategory({ id: "kitchen", slug: "kitchen", name_en: "Kitchen", name_am: "ወጥ ቤት", sort_order: 2 })
const hidden = makeCategory({ id: "hidden", slug: "hidden", is_active: false, sort_order: 0 })
const categories = [kitchen, hidden, fashion] // deliberately out of order

const wallet = makeProduct({ id: "wallet", category_id: "fashion", name_en: "Leather Wallet", name_am: "የቆዳ የኪስ ቦርሳ", price: 580, stock: 31, rating: 4.4, is_popular: true, created_at: "2026-03-01T00:00:00.000Z" })
const watch = makeProduct({ id: "watch", category_id: "fashion", name_en: "Minimalist Watch", name_am: "ቀላል የእጅ ሰዓት", price: 1900, compare_at_price: 2300, stock: 2, rating: 4.7, is_featured: true, created_at: "2026-02-01T00:00:00.000Z" })
const bag = makeProduct({ id: "bag", category_id: "fashion", name_en: "Classic Leather Bag", name_am: "ክላሲክ የቆዳ ቦርሳ", price: 1850, compare_at_price: 2400, stock: 24, rating: 4.6, is_featured: true, created_at: "2026-04-01T00:00:00.000Z" })
const belt = makeProduct({ id: "belt", category_id: "fashion", name_en: "Woven Belt", name_am: "የተሸመነ ቀበቶ", price: 420, stock: 0, rating: 4.0, created_at: "2026-01-01T00:00:00.000Z" })
const mug = makeProduct({ id: "mug", category_id: "kitchen", name_en: "Ceramic Mug Set", name_am: "የሸክላ ማንኪያ", price: 500, stock: 15, is_popular: true, created_at: "2026-05-01T00:00:00.000Z" }) // no rating, exactly on a bucket edge
const pan = makeProduct({ id: "pan", category_id: "kitchen", name_en: "Frying Pan", name_am: "መጥበሻ", price: 2000, stock: 9, rating: 4.5, created_at: "2026-06-01T00:00:00.000Z" }) // exactly on the top bucket's edge
const gone = makeProduct({ id: "gone", category_id: "kitchen", name_en: "Discontinued Kettle", price: 700, is_active: false })
const orphan = makeProduct({ id: "orphan", category_id: "no-such-category", name_en: "Orphan", price: 100 })
const products = [wallet, watch, bag, belt, mug, pan, gone, orphan]

const ids = (list: { id: string }[]) => list.map((p) => p.id)

describe("product helpers", () => {
  it("is on sale only when the 'compare at' price is higher than the price", () => {
    expect(isOnSale(watch)).toBe(true)
    expect(isOnSale(wallet)).toBe(false)
    expect(isOnSale({ ...wallet, compare_at_price: wallet.price })).toBe(false)
    expect(isOnSale({ ...wallet, compare_at_price: 100 })).toBe(false)
  })

  it("describes stock: none, low (1-5), plenty", () => {
    expect(getStockStatus(0, t)).toEqual({ label: en.product.stock.out, className: "text-error" })
    expect(getStockStatus(-3, t).label).toBe(en.product.stock.out)
    expect(getStockStatus(1, t).label).toBe(en.product.stock.low.replace("{count}", "1"))
    expect(getStockStatus(5, t).className).toBe("text-warning-text")
    expect(getStockStatus(6, t)).toEqual({ label: en.product.stock.in, className: "text-success" })
    expect(getStockStatus(2, tAm).label).toBe(am.product.stock.low.replace("{count}", "2"))
  })

  it("attaches the category's names and slug to a product, or blanks if it has none", () => {
    expect(withCategory(wallet, categories)).toMatchObject({ categoryName: "Fashion", categoryNameAm: "ፋሽን", categorySlug: "fashion" })
    expect(withCategory(orphan, categories)).toMatchObject({ categoryName: "", categorySlug: "" })
  })

  it("turns a database row into a product: photos in order, first one as the main image", () => {
    const row: ProductRow = {
      ...makeProduct(),
      rating: null,
      product_images: [
        { image_url: "https://x/second.jpg", sort_order: 2 },
        { image_url: "https://x/first.jpg", sort_order: 1 },
      ],
    } as ProductRow
    const product = toProduct(row)
    expect(product.image_url).toBe("https://x/first.jpg")
    expect(product.image_urls).toEqual(["https://x/first.jpg", "https://x/second.jpg"])
    expect(product.rating).toBeUndefined()
    expect("product_images" in product).toBe(false)
  })

  it("handles a product with no photos", () => {
    const product = toProduct({ ...makeProduct(), rating: 4.5, product_images: null } as ProductRow)
    expect(product.image_url).toBeNull()
    expect(product.image_urls).toEqual([])
    expect(product.rating).toBe(4.5)
  })
})

describe("homepage selections and categories", () => {
  it("lists only active categories, in sort order, with their active product count", () => {
    const list = listCategoriesWithCount(categories, products)
    expect(list.map((c) => c.slug)).toEqual(["fashion", "kitchen"])
    expect(list.map((c) => c.productCount)).toEqual([4, 2]) // the inactive kettle is not counted
  })

  it("picks featured, popular and on-sale products, skipping inactive ones, honouring the limit", () => {
    expect(ids(pickFeatured(products, categories))).toEqual(["watch", "bag"])
    expect(ids(pickFeatured(products, categories, 1))).toEqual(["watch"])
    expect(ids(pickPopular(products, categories))).toEqual(["wallet", "mug"])
    expect(ids(pickFlashDeals(products, categories))).toEqual(["watch", "bag"])
    expect(pickFeatured([{ ...watch, is_active: false }], categories)).toEqual([])
  })
})

describe("listProducts: filtering", () => {
  const list = (params = {}) => listProducts(products, categories, params)

  it("shows active products only", () => {
    expect(ids(list().products)).not.toContain("gone")
    expect(list().total).toBe(7)
  })

  it("filters by category slug; an unknown slug matches nothing", () => {
    expect(ids(list({ categorySlug: "kitchen" }).products)).toEqual(["mug", "pan"])
    expect(list({ categorySlug: "nope" }).total).toBe(0)
  })

  it("searches names in English or Amharic, ignoring case and outer spaces", () => {
    expect(ids(list({ query: "LEATHER" }).products)).toEqual(["wallet", "bag"])
    expect(ids(list({ query: "  wallet " }).products)).toEqual(["wallet"])
    expect(ids(list({ query: "ቦርሳ" }).products)).toEqual(["wallet", "bag"]) // Amharic term matches Amharic names
    expect(list({ query: "zzz" }).total).toBe(0)
  })

  it("puts a price on the boundary in the higher bucket (min inclusive, max exclusive)", () => {
    expect(ids(list({ priceBucket: "under-500" }).products)).toEqual(["belt", "orphan"])
    expect(ids(list({ priceBucket: "500-1000" }).products)).toEqual(["wallet", "mug"]) // mug at exactly 500
    expect(ids(list({ priceBucket: "1000-2000" }).products)).toEqual(["watch", "bag"])
    expect(ids(list({ priceBucket: "2000-plus" }).products)).toEqual(["pan"]) // pan at exactly 2000
  })

  it("has price buckets that cover every price exactly once", () => {
    for (const price of [0, 1, 499, 500, 999, 1000, 1999, 2000, 999999]) {
      const hits = PRICE_BUCKETS.filter((b) => price >= b.min && price < b.max)
      expect(hits, `price ${price}`).toHaveLength(1)
    }
  })

  it("filters to what is in stock", () => {
    expect(ids(list({ inStockOnly: true }).products)).not.toContain("belt")
    expect(list({ inStockOnly: true }).total).toBe(6)
  })

  it("filters by minimum rating, leaving out unrated products", () => {
    expect(ids(list({ minRating: 4.5 }).products)).toEqual(["watch", "bag", "pan"])
    expect(ids(list({ minRating: 4 }).products)).toEqual(["wallet", "watch", "bag", "belt", "pan"])
  })

  it("filters to what is on sale", () => {
    expect(ids(list({ onSaleOnly: true }).products)).toEqual(["watch", "bag"])
  })

  it("combines filters", () => {
    expect(ids(list({ categorySlug: "fashion", inStockOnly: true, minRating: 4.5 }).products)).toEqual(["watch", "bag"])
    expect(list({ categorySlug: "kitchen", onSaleOnly: true }).total).toBe(0)
  })
})

describe("listProducts: sorting and paging", () => {
  const list = (params = {}) => listProducts(products, categories, params)

  it("keeps catalog order for 'recommended'", () => {
    expect(ids(list().products)).toEqual(["wallet", "watch", "bag", "belt", "mug", "pan", "orphan"])
  })

  it("sorts by price, and by newest first", () => {
    const asc = list({ sort: "price-asc" }).products.map((p) => p.price)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    expect(asc[0]).toBe(100) // the cheapest product is first
    const desc = list({ sort: "price-desc" }).products.map((p) => p.price)
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
    expect(ids(list({ sort: "price-desc" }).products)[0]).toBe("pan")
    expect(ids(list({ sort: "newest" }).products).slice(0, 2)).toEqual(["pan", "mug"])
  })

  it("puts popular products first, then the rest in a stable order", () => {
    const result = ids(list({ sort: "popular" }).products)
    expect(result.slice(0, 2)).toEqual(["mug", "wallet"]) // both popular, tie broken by id
    expect(result.slice(2)).not.toContain("mug")
  })

  it("does not change the catalog array it was given", () => {
    const before = ids(products)
    list({ sort: "price-desc" })
    expect(ids(products)).toEqual(before)
  })

  it("splits results into pages and reports how many there are", () => {
    const first = list({ pageSize: 3 })
    expect(first).toMatchObject({ total: 7, page: 1, pageSize: 3, totalPages: 3 })
    expect(first.products).toHaveLength(3)
    expect(list({ pageSize: 3, page: 3 }).products).toHaveLength(1)
  })

  it("clamps a page that is out of range instead of returning nothing", () => {
    expect(list({ pageSize: 3, page: 99 }).page).toBe(3)
    expect(list({ pageSize: 3, page: 0 }).page).toBe(1)
    expect(list({ pageSize: 3, page: -4 }).page).toBe(1)
  })

  it("reports one (empty) page when nothing matches", () => {
    expect(list({ query: "zzz" })).toMatchObject({ total: 0, page: 1, totalPages: 1, products: [] })
  })

  it("defaults to 12 per page", () => {
    expect(list().pageSize).toBe(12)
  })
})

describe("computeFilterFacets", () => {
  it("counts each option against the products in scope", () => {
    const facets = computeFilterFacets(products, categories)
    expect(facets.categories).toEqual([
      { slug: "fashion", name: "Fashion", nameAm: "ፋሽን", count: 4 },
      { slug: "kitchen", name: "Kitchen", nameAm: "ወጥ ቤት", count: 2 },
    ])
    expect(Object.fromEntries(facets.priceBuckets.map((b) => [b.id, b.count]))).toEqual({
      "under-500": 2,
      "500-1000": 2,
      "1000-2000": 2,
      "2000-plus": 1,
    })
    expect(facets.inStockCount).toBe(6)
    expect(facets.onSaleCount).toBe(2)
    expect(facets.ratingCounts).toEqual(RATING_THRESHOLDS.map((min) => ({ min, count: min === 4 ? 5 : 3 })))
  })

  it("narrows the counts to a category or a search, like the results do", () => {
    const kitchenOnly = computeFilterFacets(products, categories, { categorySlug: "kitchen" })
    expect(kitchenOnly.inStockCount).toBe(2)
    expect(kitchenOnly.categories.find((c) => c.slug === "fashion")!.count).toBe(0)
    const searched = computeFilterFacets(products, categories, { query: "leather" })
    expect(searched.inStockCount).toBe(2)
  })

  it("never disagrees with the list it describes", () => {
    const facets = computeFilterFacets(products, categories)
    expect(facets.inStockCount).toBe(listProducts(products, categories, { inStockOnly: true }).total)
    expect(facets.onSaleCount).toBe(listProducts(products, categories, { onSaleOnly: true }).total)
    for (const bucket of facets.priceBuckets) {
      expect(bucket.count).toBe(listProducts(products, categories, { priceBucket: bucket.id }).total)
    }
  })
})

describe("priceBucketLabel", () => {
  it("words each bucket in the visitor's language", () => {
    expect(priceBucketLabel("under-500", t)).toBe(en.catalog.filters.priceUnder.replace("{amount}", "500 ETB"))
    expect(priceBucketLabel("2000-plus", t)).toBe(en.catalog.filters.priceOver.replace("{amount}", "2,000 ETB"))
    expect(priceBucketLabel("500-1000", t)).toBe(en.catalog.filters.priceRange.replace("{min}", "500").replace("{max}", "1,000 ETB"))
    expect(priceBucketLabel("500-1000", tAm)).toContain("1,000")
  })
})

describe("parseListingParams", () => {
  it("reads every filter from the address-bar query", () => {
    expect(parseListingParams({ category: "fashion", q: "wallet", price: "500-1000", stock: "1", rating: "4.5", sale: "1", sort: "price-asc", page: "2" })).toEqual({
      categorySlug: "fashion",
      query: "wallet",
      priceBucket: "500-1000",
      inStockOnly: true,
      minRating: 4.5,
      onSaleOnly: true,
      sort: "price-asc",
      page: 2,
    })
  })

  it("ignores values it does not recognise instead of failing", () => {
    expect(parseListingParams({ price: "free", sort: "cheapest", rating: "3", stock: "yes", sale: "true", page: "abc" })).toEqual({
      categorySlug: undefined,
      query: undefined,
      priceBucket: undefined,
      inStockOnly: false,
      minRating: undefined,
      onSaleOnly: false,
      sort: undefined,
      page: undefined,
    })
  })

  it("only accepts the rating thresholds the filter offers", () => {
    expect(parseListingParams({ rating: "4" }).minRating).toBe(4)
    expect(parseListingParams({ rating: "4.5" }).minRating).toBe(4.5)
    expect(parseListingParams({ rating: "4.2" }).minRating).toBeUndefined()
    expect(parseListingParams({ rating: "" }).minRating).toBeUndefined()
  })

  it("makes sense of pages: whole numbers from 1 up", () => {
    expect(parseListingParams({ page: "3" }).page).toBe(3)
    expect(parseListingParams({ page: "2.9" }).page).toBe(2)
    expect(parseListingParams({ page: "0" }).page).toBeUndefined()
    expect(parseListingParams({ page: "-1" }).page).toBeUndefined()
    expect(parseListingParams({ page: "Infinity" }).page).toBeUndefined()
  })

  it("uses the first value of a repeated parameter and treats empty ones as absent", () => {
    expect(parseListingParams({ category: ["fashion", "kitchen"] }).categorySlug).toBe("fashion")
    expect(parseListingParams({ category: "", q: "" })).toMatchObject({ categorySlug: undefined, query: undefined })
  })
})
