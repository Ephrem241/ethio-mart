import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"

// PURE catalog logic: types, row mappers, and filter/sort/facet functions
// that operate on arrays they are handed. No data access lives here, so
// client components can import the types/helpers freely (nothing in this
// file touches next/headers or a Supabase client). The database queries are
// in catalog-queries.ts (server) and catalog-client.ts (browser).

export type ProductWithCategory = Product & {
  categoryName: string
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
export interface ProductRow extends Omit<Product, "rating" | "image_url"> {
  rating: number | null
  product_images?: { image_url: string; sort_order: number }[] | null
}

export function toProduct(row: ProductRow): Product {
  const { product_images, rating, ...rest } = row
  const primary = [...(product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
  return { ...rest, rating: rating ?? undefined, image_url: primary?.image_url ?? null }
}

export function withCategory(product: Product, categories: Category[]): ProductWithCategory {
  const category = categories.find((c) => c.id === product.category_id)
  return {
    ...product,
    categoryName: category?.name_en ?? "",
    categorySlug: category?.slug ?? "",
  }
}

export function isOnSale(product: Product): boolean {
  return product.compare_at_price != null && product.compare_at_price > product.price
}

export function getStockStatus(stock: number): { label: string; className: string } {
  if (stock <= 0) return { label: "Out of stock", className: "text-error" }
  if (stock <= 5) return { label: `Only ${stock} left in stock`, className: "text-warning" }
  return { label: "In stock", className: "text-success" }
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
  { id: "under-500", label: "Under 500 ETB", min: 0, max: 500 },
  { id: "500-1000", label: "500 – 1,000 ETB", min: 500, max: 1000 },
  { id: "1000-2000", label: "1,000 – 2,000 ETB", min: 1000, max: 2000 },
  { id: "2000-plus", label: "2,000 ETB & above", min: 2000, max: Infinity },
] as const

export type PriceBucketId = (typeof PRICE_BUCKETS)[number]["id"]
const PRICE_BUCKET_IDS = PRICE_BUCKETS.map((b) => b.id) as PriceBucketId[]

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
  categories: { slug: string; name: string; count: number }[]
  priceBuckets: { id: PriceBucketId; label: string; count: number }[]
  inStockCount: number
  onSaleCount: number
  ratingCounts: { min: number; count: number }[]
}

function matchesQuery(product: Product, query: string): boolean {
  return product.name_en.toLowerCase().includes(query.trim().toLowerCase())
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
        count: base.filter((p) => p.category_id === c.id).length,
      })),
    priceBuckets: PRICE_BUCKETS.map((b) => ({
      id: b.id,
      label: b.label,
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
