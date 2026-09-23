import { parseListingParams } from "@/lib/services/catalog"
import { getProducts, getFilterFacets } from "@/lib/services/catalog-queries"
import { ProductListing } from "@/components/catalog/product-listing"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const parsed = parseListingParams(rawParams)

  const [result, facets] = await Promise.all([
    getProducts(parsed),
    getFilterFacets({ query: parsed.query }),
  ])

  return (
    <div className="space-y-8 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Shop</h1>
        <p className="text-muted-text">Browse our full collection.</p>
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
        basePath="/shop"
      />
    </div>
  )
}
