import { PackageSearch } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory, FilterFacets, SortOption } from "@/lib/services/catalog"
import { ProductGrid } from "@/components/product/product-grid"
import { EmptyState } from "@/components/feedback/empty-state"
import { FilterSidebar } from "@/components/catalog/filter-sidebar"
import { FilterDrawer } from "@/components/catalog/filter-drawer"
import { SortSelect } from "@/components/catalog/sort-select"
import { Pagination } from "@/components/catalog/pagination"
import { LoadMoreProducts } from "@/components/catalog/load-more-products"
import type { FilterValues, RawParams } from "@/components/catalog/listing-url"

// Shared by /shop, /category/[slug], and /search — each page renders its own
// header above this (breadcrumb/banner/title differ too much to force into
// one slot API, Rule 6) and fetches its own data, but the filter/sort/grid/
// pagination chrome below is identical everywhere (Rule 5).
//
// Phones and tablets: Filter and Sort sit in a bar pinned under the header
// while the products scroll; the filters open in a bottom sheet; "Load more"
// adds the next page below the grid instead of numbered pages. Desktop keeps
// the sidebar, the sort menu beside the result count, and the page numbers.
async function ProductListing({
  products,
  total,
  page,
  pageSize,
  totalPages,
  filters,
  sort,
  facets,
  showCategoryFilter = true,
  rawParams,
  basePath,
}: {
  products: ProductWithCategory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  filters: FilterValues
  sort: SortOption
  facets: FilterFacets
  showCategoryFilter?: boolean
  rawParams: RawParams
  basePath: string
}) {
  const t = await getT()
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)
  const resultSummary =
    total === 0
      ? t("catalog.noResults")
      : t("catalog.results", { start: rangeStart, end: rangeEnd, total })

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      {/* Full width (it cancels the page's side padding) and 44px controls; the
          sort menu's 16px text keeps iOS from zooming in when it is tapped. */}
      <div className="sticky top-(--mobile-header-height) z-20 -mx-4 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <FilterDrawer
          filters={filters}
          facets={facets}
          showCategory={showCategoryFilter}
          rawParams={rawParams}
          basePath={basePath}
          className="h-11 flex-1 text-[15px]"
        />
        <SortSelect value={sort} rawParams={rawParams} basePath={basePath} className="h-11 min-w-0 flex-1 text-base" />
      </div>

      <FilterSidebar
        filters={filters}
        facets={facets}
        showCategory={showCategoryFilter}
        rawParams={rawParams}
        basePath={basePath}
      />

      <div className="flex-1 space-y-6">
        <div className="hidden items-center justify-between lg:flex">
          <p role="status" className="text-sm text-muted-text">
            {resultSummary}
          </p>
          <SortSelect value={sort} rawParams={rawParams} basePath={basePath} />
        </div>
        {/* Phones: just the count — the "Showing 1–24 of…" range lives by the
            Load more button, where it changes as more products are added. */}
        <p role="status" className="text-sm text-muted-text lg:hidden">
          {total === 0 ? t("catalog.noResults") : t.plural("catalog.productCount", total)}
        </p>

        {products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={t("catalog.emptyTitle")}
            description={t("catalog.emptyText")}
          />
        ) : (
          <div>
            <ProductGrid products={products} eagerCount={4} />
            <LoadMoreProducts
              key={`${JSON.stringify(rawParams)}|${filters.categorySlug ?? ""}`}
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              rawParams={rawParams}
              categorySlug={filters.categorySlug}
            />
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} rawParams={rawParams} basePath={basePath} />
      </div>
    </div>
  )
}

export { ProductListing }
