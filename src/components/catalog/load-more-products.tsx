"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product/product-card"
import type { RawParams } from "@/components/catalog/listing-url"

// Phones and tablets: instead of numbered pages, "Load more" adds the next
// page of the same listing below the grid (from /api/products, which answers
// through the same code as the page). Desktop keeps the numbered Pagination;
// this whole block is `lg:hidden`.
//
// ProductListing remounts it (a `key` from the query) whenever the filters or
// the sort change, so what it has added never outlives the listing it belongs
// to. After a load, keyboard focus moves to the first new product — without
// scrolling: the new cards appear where the button was, which is where the
// shopper is already looking.
function LoadMoreProducts({
  page,
  pageSize,
  total,
  totalPages,
  rawParams,
  categorySlug,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  rawParams: RawParams
  /** A category page's own category (it comes from the path, not the query). */
  categorySlug?: string
}) {
  const t = useT()
  const [items, setItems] = useState<ProductWithCategory[]>([])
  const [lastPage, setLastPage] = useState(page)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const focusFrom = useRef<number | null>(null)

  useEffect(() => {
    if (focusFrom.current == null) return
    const firstNew = listRef.current?.children[focusFrom.current]
    firstNew?.querySelector<HTMLAnchorElement>("a[href]")?.focus({ preventScroll: true })
    focusFrom.current = null
  }, [items])

  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(lastPage * pageSize, total)

  async function loadMore() {
    setLoading(true)
    setFailed(false)
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(rawParams)) {
      if (value == null || key === "page") continue
      params.set(key, Array.isArray(value) ? value[0] : value)
    }
    if (categorySlug) params.set("category", categorySlug)
    params.set("page", String(lastPage + 1))
    try {
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`) // i18n-ignore: never shown
      const data: { products: ProductWithCategory[]; page: number } = await response.json()
      focusFrom.current = items.length
      setItems((shown) => {
        const seen = new Set(shown.map((p) => p.id))
        return [...shown, ...data.products.filter((p) => !seen.has(p.id))]
      })
      setLastPage(data.page)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg:hidden">
      {items.length > 0 && (
        // The same columns and gaps as ProductGrid, so the new cards continue it.
        <div ref={listRef} className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-3 sm:gap-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} t={t} />
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-col items-center gap-3">
        <p role="status" className="text-sm text-muted-text">
          {t("catalog.results", { start, end, total })}
        </p>
        {failed && (
          <p role="alert" className="text-center text-sm text-error">
            {t("catalog.pagination.loadFailed")}
          </p>
        )}
        {lastPage < totalPages && (
          <Button variant="outline" size="lg" className="w-full max-w-sm" disabled={loading} onClick={loadMore}>
            {loading ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                {t("catalog.pagination.loading")}
              </>
            ) : (
              t("catalog.pagination.loadMore")
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export { LoadMoreProducts }
