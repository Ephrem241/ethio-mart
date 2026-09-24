import type { Metadata } from "next"
import { Search } from "lucide-react"

import { parseListingParams } from "@/lib/services/catalog"
import { getProducts, getFilterFacets } from "@/lib/services/catalog-queries"
import { getT } from "@/lib/i18n/server"
import { ProductListing } from "@/components/catalog/product-listing"
import { EmptyState } from "@/components/feedback/empty-state"
import { PageHeader } from "@/components/layout/page-header"

// Internal search results are never indexed (thin, endless variations), but
// their links are followed so the products they list can be discovered.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const [raw, t] = await Promise.all([searchParams, getT()])
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q
  return {
    title: q ? t("catalog.searchResultsFor", { query: q }) : t("catalog.searchTitle"),
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const parsed = parseListingParams(rawParams)
  const q = parsed.query
  const t = await getT()

  if (!q) {
    return (
      <div className="space-y-8 py-6 lg:py-8">
        <PageHeader title={t("catalog.searchTitle")} />
        <EmptyState
          icon={Search}
          title={t("catalog.searchEmptyTitle")}
          description={t("catalog.searchEmptyText")}
        />
      </div>
    )
  }

  const [result, facets] = await Promise.all([
    getProducts(parsed),
    getFilterFacets({ query: q }),
  ])

  return (
    <div className="space-y-8 py-6 lg:py-8">
      <PageHeader title={t("catalog.searchResultsFor", { query: q })} />
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
