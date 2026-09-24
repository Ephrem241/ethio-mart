import type { Metadata } from "next"

import { parseListingParams } from "@/lib/services/catalog"
import { listingSeo, pageMetadata, withPageNumber } from "@/lib/seo/metadata"
import { getProducts, getFilterFacets } from "@/lib/services/catalog-queries"
import { getT } from "@/lib/i18n/server"
import { ProductListing } from "@/components/catalog/product-listing"
import { PageHeader } from "@/components/layout/page-header"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

// /shop?sale=1 is the "Deals" page and is indexable; sorted/filtered variants
// are hidden and canonical to the plain listing (see listingSeo).
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const [raw, t] = await Promise.all([searchParams, getT()])
  const seo = listingSeo(raw, { allowSale: true })
  const deals = !!seo.params.sale
  // The page number as actually shown: ?page=99 renders the last page, and
  // that page's canonical must be its real address, not the requested one.
  const { page } = await getProducts(parseListingParams(raw))
  return pageMetadata({
    locale: t.locale,
    path: "/shop",
    title: withPageNumber(deals ? t("nav.deals") : t("catalog.shopTitle"), page, t),
    description: deals ? t("home.flashSubtitle") : t("catalog.shopSubtitle"),
    listing: { ...seo.params, page },
    indexable: seo.indexable,
  })
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const parsed = parseListingParams(rawParams)

  const [result, facets, t] = await Promise.all([
    getProducts(parsed),
    getFilterFacets({ query: parsed.query }),
    getT(),
  ])

  return (
    <div className="space-y-8 py-6 lg:py-8">
      <PageHeader
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("catalog.shopTitle") }]}
        title={t("catalog.shopTitle")}
        description={t("catalog.shopSubtitle")}
      />
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
