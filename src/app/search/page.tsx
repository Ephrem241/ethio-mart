import { Search } from "lucide-react"

import { parseListingParams } from "@/lib/services/catalog"
import { getProducts, getFilterFacets } from "@/lib/services/catalog-queries"
import { ProductListing } from "@/components/catalog/product-listing"
import { EmptyState } from "@/components/feedback/empty-state"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const parsed = parseListingParams(rawParams)
  const q = parsed.query

  if (!q) {
    return (
      <div className="space-y-8 py-8">
        <h1 className="text-2xl font-semibold text-charcoal">Search</h1>
        <EmptyState
          icon={Search}
          title="Search our catalog"
          description="Type a product name above to get started."
        />
      </div>
    )
  }

  const [result, facets] = await Promise.all([
    getProducts(parsed),
    getFilterFacets({ query: q }),
  ])

  return (
    <div className="space-y-8 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Search results for &quot;{q}&quot;</h1>
      </div>
      <ProductListing
        products={result.products}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        filters={parsed}
        sort={parsed.sort ?? "recommended"}
        facets={facets}
        showCategoryFilter
        rawParams={rawParams}
        basePath="/search"
      />
    </div>
  )
}
