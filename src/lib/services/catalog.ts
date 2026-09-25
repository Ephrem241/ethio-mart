import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"
import type { Translator } from "@/lib/i18n/translator"
import { formatNumber, formatPrice } from "@/lib/currency"

// PURE catalog logic: types, row mappers, and filter/sort/facet functions
// that operate on arrays they are handed. No data access lives here, so
// client components can import the types/helpers freely (nothing in this
// file touches next/headers or a Supabase client). The database queries are
// in catalog-queries.ts (server) and catalog-client.ts (browser).

export type ProductWithCategory = Product & {
  categoryName: string
  categoryNameAm: string
  categorySlug: string
}

export type CategoryWithCount = Category & {
  productCount: number
}

// ---------------------------------------------------------------------------
// Row mapping (Postgres -> app types)
// ---------------------------------------------------------------------------

// Postgres returns NULL where the app types use `undefined` (rating) and
// nests the product's images; flatten to the single `image_url` the UI has
// always consumed (first image by sort_order), so ProductCard,
// ImagePlaceholder and the admin form needed no changes for real images.
export interface ProductRow extends Omit<Product, "rating" | "image_url" | "image_urls"> {
  rating: number | null
  product_images?: { image_url: string; sort_order: number }[] | null
}

export function toProduct(row: ProductRow): Product {
  const { product_images, rating, ...rest } = row
  const images = [...(product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  return {
    ...rest,
    rating: rating ?? undefined,
    image_url: images[0]?.image_url ?? null,
    image_urls: images.map((image) => image.image_url),
  }
}

export function withCategory(product: Product, categories: Category[]): ProductWithCategory {
  const category = categories.find((c) => c.id === product.category_id)
  return {
    ...product,
    categoryName: category?.name_en ?? "",
    categoryNameAm: category?.name_am ?? "",
    categorySlug: category?.slug ?? "",
  }
}

export function isOnSale(product: Product): boolean {
  return product.compare_at_price != null && product.compare_at_price > product.price
}

export function getStockStatus(stock: number, t: Translator): { label: string; className: string } {
  if (stock <= 0) return { label: t("product.stock.out"), className: "text-error" }
  if (stock <= 5) return { label: t("product.stock.low", { count: stock }), className: "text-warning-text" }
  return { label: t("product.stock.in"), className: "text-success" }
}

// ---------------------------------------------------------------------------
// Homepage selections and category list
// ---------------------------------------------------------------------------

export function listCategoriesWithCount(
  categories: Category[],
  products: Product[]
): CategoryWithCount[] {
  return categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      ...c,
      productCount: products.filter((p) => p.category_id === c.id && p.is_active).length,
    }))
}

export function pickFeatured(products: Product[], categories: Category[], limit = 8): ProductWithCategory[] {
  return products
    .filter((p) => p.is_active && p.is_featured)
    .slice(0, limit)
    .map((p) => withCategory(p, categories))
}

export function pickPopular(products: Product[], categories: Category[], limit = 8): ProductWithCategory[] {
  return products
    .filter((p) => p.is_active && p.is_popular)
    .slice(0, limit)
    .map((p) => withCategory(p, categories))
}

export function pickFlashDeals(products: Product[], categories: Category[], limit = 8): ProductWithCategory[] {
  return products
    .filter((p) => p.is_active && isOnSale(p))
    .slice(0, limit)
    .map((p) => withCategory(p, categories))
}

// ---------------------------------------------------------------------------
// Product listing (shop / category / search)
// ---------------------------------------------------------------------------

export const PRICE_BUCKETS = [
  { id: "under-500", min: 0, max: 500 },
  { id: "500-1000", min: 500, max: 1000 },
  { id: "1000-2000", min: 1000, max: 2000 },
  { id: "2000-plus", min: 2000, max: Infinity },
] as const

export type PriceBucketId = (typeof PRICE_BUCKETS)[number]["id"]
const PRICE_BUCKET_IDS = PRICE_BUCKETS.map((b) => b.id) as PriceBucketId[]

// "Under 500 ETB" / "500 – 1,000 ETB" / "2,000 ETB & above" — assembled from
// the bucket's bounds so the wording (and the currency) follow the language.
export function priceBucketLabel(id: PriceBucketId, t: Translator): string {
  const bucket = PRICE_BUCKETS.find((b) => b.id === id)!
  if (bucket.min === 0) return t("catalog.filters.priceUnder", { amount: formatPrice(bucket.max, t) })
  if (bucket.max === Infinity) return t("catalog.filters.priceOver", { amount: formatPrice(bucket.min, t) })
  return t("catalog.filters.priceRange", { min: formatNumber(bucket.min), max: formatPrice(bucket.max, t) })
}

// Seed ratings cluster between 4.0 and 4.8, so a single "4 stars & up"
// threshold would barely filter anything. Two thresholds make the filter
// visibly do something instead of being decorative (Rule 3).
export const RATING_THRESHOLDS: number[] = [4, 4.5]

export type SortOption = "recommended" | "newest" | "price-asc" | "price-desc" | "popular"
const SORT_OPTIONS: SortOption[] = ["recommended", "newest", "price-asc", "price-desc", "popular"]

export interface GetProductsParams {
  categorySlug?: string
  query?: string
  priceBucket?: PriceBucketId
  inStockOnly?: boolean
  minRating?: number
  onSaleOnly?: boolean
  sort?: SortOption
  page?: number
  pageSize?: number
}

export interface ProductListResult {
  products: ProductWithCategory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FilterFacets {
  categories: { slug: string; name: string; nameAm: string; count: number }[]
  priceBuckets: { id: PriceBucketId; count: number }[]
  inStockCount: number
  onSaleCount: number
  ratingCounts: { min: number; count: number }[]
}

// Matches either language, whichever the page is shown in: an Amharic
// shopper can type Amharic, an English one English. (Amharic has no letter
// case, so lower-casing is a no-op there.)
function matchesQuery(product: Product, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return (
    product.name_en.toLowerCase().includes(needle) ||
    (product.name_am ?? "").toLowerCase().includes(needle)
  )
}

// Applies every filter EXCEPT pagination/sort. Shared by listProducts (full
// filter set) and computeFilterFacets (base scope only), so counts and
// results can never silently drift out of sync (Rule 4).
//
// `categorySlug` is resolved through the categories list to that category's
// `id` before filtering products, rather than compared against
// `product.category_id` directly — category ids are real UUIDs now.
function applyFilters(
  list: Product[],
  categories: Category[],
  params: Pick<
    GetProductsParams,
    "categorySlug" | "query" | "priceBucket" | "inStockOnly" | "minRating" | "onSaleOnly"
  >
): Product[] {
  let result = list.filter((p) => p.is_active)

  if (params.categorySlug) {
    const category = categories.find((c) => c.slug === params.categorySlug)
    result = category ? result.filter((p) => p.category_id === category.id) : []
  }
  if (params.query) {
    result = result.filter((p) => matchesQuery(p, params.query!))
  }
  if (params.priceBucket) {
    const bucket = PRICE_BUCKETS.find((b) => b.id === params.priceBucket)
    if (bucket) {
      result = result.filter((p) => p.price >= bucket.min && p.price < bucket.max)
    }
  }
  if (params.inStockOnly) {
    result = result.filter((p) => p.stock > 0)
  }
  if (params.minRating != null) {
    result = result.filter((p) => p.rating != null && p.rating >= params.minRating!)
  }
  if (params.onSaleOnly) {
    result = result.filter(isOnSale)
  }

  return result
}

function sortProducts(list: ProductWithCategory[], sort: SortOption): ProductWithCategory[] {
  switch (sort) {
    case "newest":
      return [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price)
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price)
    case "popular":
      return [...list].sort((a, b) => {
        if (a.is_popular === b.is_popular) return a.id.localeCompare(b.id)
        return a.is_popular ? -1 : 1
      })
    case "recommended":
    default:
      // Honest no-op: stable catalog order, rather than inventing a fake
      // secondary ranking (Rule 6).
      return list
  }
}

export function listProducts(
  products: Product[],
  categories: Category[],
  params: GetProductsParams = {}
): ProductListResult {
  const pageSize = params.pageSize ?? 12
  const filtered = applyFilters(products, categories, params).map((p) => withCategory(p, categories))
  const sorted = sortProducts(filtered, params.sort ?? "recommended")

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(params.page ?? 1, 1), totalPages)

  const start = (page - 1) * pageSize
  return { products: sorted.slice(start, start + pageSize), total, page, pageSize, totalPages }
}

export function computeFilterFacets(
  products: Product[],
  categories: Category[],
  params: { categorySlug?: string; query?: string } = {}
): FilterFacets {
  const base = applyFilters(products, categories, params)

  return {
    categories: categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        slug: c.slug,
        name: c.name_en,
        nameAm: c.name_am,
        count: base.filter((p) => p.category_id === c.id).length,
      })),
    priceBuckets: PRICE_BUCKETS.map((b) => ({
      id: b.id,
      count: base.filter((p) => p.price >= b.min && p.price < b.max).length,
    })),
    inStockCount: base.filter((p) => p.stock > 0).length,
    onSaleCount: base.filter(isOnSale).length,
    ratingCounts: RATING_THRESHOLDS.map((min) => ({
      min,
      count: base.filter((p) => p.rating != null && p.rating >= min).length,
    })),
  }
}

type RawSearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

function parseRating(value: string | undefined): number | undefined {
  if (value == null) return undefined
  const num = Number(value)
  return RATING_THRESHOLDS.includes(num) ? num : undefined
}

function parsePage(value: string | undefined): number | undefined {
  if (value == null) return undefined
  const num = Number(value)
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : undefined
}

// Single shared parser so /shop, /category/[slug], and /search all read the
// URL the same way (Rule 4).
export function parseListingParams(raw: RawSearchParams): GetProductsParams {
  return {
    categorySlug: firstValue(raw.category) || undefined,
    query: firstValue(raw.q) || undefined,
    priceBucket: parseEnum(firstValue(raw.price), PRICE_BUCKET_IDS),
    inStockOnly: firstValue(raw.stock) === "1",
    minRating: parseRating(firstValue(raw.rating)),
    onSaleOnly: firstValue(raw.sale) === "1",
    sort: parseEnum(firstValue(raw.sort), SORT_OPTIONS),
    page: parsePage(firstValue(raw.page)),
  }
}
