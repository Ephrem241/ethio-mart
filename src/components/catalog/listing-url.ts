export type RawParams = Record<string, string | string[] | undefined>

function cloneParams(rawParams: RawParams, excludeKeys: string[]): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(rawParams)) {
    if (value == null || excludeKeys.includes(key)) continue
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    else params.set(key, value)
  }
  return params
}

function toUrl(basePath: string, params: URLSearchParams): string {
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export interface FilterValues {
  categorySlug?: string
  priceBucket?: string
  inStockOnly?: boolean
  minRating?: number
  onSaleOnly?: boolean
}

// Changing a filter or the sort always resets pagination to page 1 (the
// result set/order both shift); only the Pagination links set `page`
// themselves.

export function buildFilterUrl(basePath: string, rawParams: RawParams, next: FilterValues): string {
  const params = cloneParams(rawParams, ["category", "price", "stock", "rating", "sale", "page"])
  if (next.categorySlug) params.set("category", next.categorySlug)
  if (next.priceBucket) params.set("price", next.priceBucket)
  if (next.inStockOnly) params.set("stock", "1")
  if (next.minRating != null) params.set("rating", String(next.minRating))
  if (next.onSaleOnly) params.set("sale", "1")
  return toUrl(basePath, params)
}

export function buildSortUrl(basePath: string, rawParams: RawParams, sort: string): string {
  const params = cloneParams(rawParams, ["sort", "page"])
  if (sort !== "recommended") params.set("sort", sort)
  return toUrl(basePath, params)
}

export function buildPageUrl(basePath: string, rawParams: RawParams, page: number): string {
  const params = cloneParams(rawParams, ["page"])
  if (page > 1) params.set("page", String(page))
  return toUrl(basePath, params)
}
