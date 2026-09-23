import { notFound } from "next/navigation"

import { parseListingParams } from "@/lib/services/catalog"
import {
  getCategoryBySlug,
  getProducts,
  getFilterFacets,
} from "@/lib/services/catalog-queries"
import { ProductListing } from "@/components/catalog/product-listing"
import { Breadcrumb } from "@/components/navigation/breadcrumb"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const rawParams = await searchParams
  const parsed = parseListingParams(rawParams)
  const listingParams = { ...parsed, categorySlug: category.slug }

  const [result, facets] = await Promise.all([
    getProducts(listingParams),
    getFilterFacets({ categorySlug: category.slug, query: parsed.query }),
  ])

  return (
    <div className="space-y-8 py-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: category.name_en }]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-charcoal">{category.name_en}</h1>
          <p className="text-muted-text">{category.description_en}</p>
        </div>
        <ImagePlaceholder
          seed={category.id}
          icon={getCategoryIcon(category.slug)}
          label={category.name_en}
          imageUrl={category.image_url || null}
          aspectClassName="aspect-[21/9] lg:aspect-video"
        />
      </div>
      <ProductListing
        products={result.products}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        filters={listingParams}
        sort={parsed.sort ?? "recommended"}
        facets={facets}
        showCategoryFilter={false}
        rawParams={rawParams}
        basePath={`/category/${category.slug}`}
      />
    </div>
  )
}
