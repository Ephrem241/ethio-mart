import { PackageSearch } from "lucide-react"

import type { ProductWithCategory, FilterFacets, SortOption } from "@/lib/services/catalog"
import { ProductGrid } from "@/components/product/product-grid"
import { EmptyState } from "@/components/feedback/empty-state"
import { FilterSidebar } from "@/components/catalog/filter-sidebar"
import { FilterDrawer } from "@/components/catalog/filter-drawer"
import { SortSelect } from "@/components/catalog/sort-select"
import { Pagination } from "@/components/catalog/pagination"
import type { FilterValues, RawParams } from "@/components/catalog/listing-url"

// Shared by /shop, /category/[slug], and /search — each page renders its own
// header above this (breadcrumb/banner/title differ too much to force into
// one slot API, Rule 6) and fetches its own data, but the filter/sort/grid/
// pagination chrome below is identical everywhere (Rule 5).
function ProductListing({
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
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)
  const resultSummary =
    total === 0 ? "No results" : `Showing ${rangeStart}–${rangeEnd} of ${total} results`

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <FilterDrawer
          filters={filters}
          facets={facets}
          showCategory={showCategoryFilter}
          rawParams={rawParams}
          basePath={basePath}
        />
        <SortSelect value={sort} rawParams={rawParams} basePath={basePath} />
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
          <p className="text-sm text-muted-text">{resultSummary}</p>
          <SortSelect value={sort} rawParams={rawParams} basePath={basePath} />
        </div>
        <p className="text-sm text-muted-text lg:hidden">{resultSummary}</p>

        {products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products found."
            description="Try another search or explore our categories."
          />
        ) : (
          <ProductGrid products={products} />
        )}

        <Pagination page={page} totalPages={totalPages} rawParams={rawParams} basePath={basePath} />
      </div>
    </div>
  )
}

export { ProductListing }
