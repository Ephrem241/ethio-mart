import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { parseListingParams } from "@/lib/services/catalog"
import {
  getCategoryBySlug,
  getProducts,
  getFilterFacets,
} from "@/lib/services/catalog-queries"
import { descriptionOf, nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import { listingSeo, pageMetadata, truncateDescription, withPageNumber } from "@/lib/seo/metadata"
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo/json-ld"
import { JsonLd } from "@/components/seo/json-ld"
import { ProductListing } from "@/components/catalog/product-listing"
import { PageHeader } from "@/components/layout/page-header"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"

type RouteProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: RouteProps): Promise<Metadata> {
  const { slug } = await params
  const [category, raw, t] = await Promise.all([getCategoryBySlug(slug), searchParams, getT()])
  if (!category) return { title: t("catalog.categoryNotFound") }

  const name = nameOf(category, t.locale)
  const seo = listingSeo(raw, { allowSale: false })
  const { page } = await getProducts({ ...parseListingParams(raw), categorySlug: category.slug })
  return pageMetadata({
    locale: t.locale,
    path: `/category/${category.slug}`,
    title: withPageNumber(name, page, t),
    description: truncateDescription(descriptionOf(category, t.locale)),
    image: category.image_url ? { url: category.image_url, alt: name } : null,
    listing: { ...seo.params, page },
    indexable: seo.indexable,
  })
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const [category, t] = await Promise.all([getCategoryBySlug(slug), getT()])
  if (!category) notFound()
  const categoryName = nameOf(category, t.locale)

  const rawParams = await searchParams
  const parsed = parseListingParams(rawParams)
  const listingParams = { ...parsed, categorySlug: category.slug }

  const [result, facets] = await Promise.all([
    getProducts(listingParams),
    getFilterFacets({ categorySlug: category.slug, query: parsed.query }),
  ])

  const categoryPath = `/category/${category.slug}`

  return (
    <div className="space-y-8 py-8">
      <JsonLd
        nodes={[
          breadcrumbJsonLd([
            { name: t("nav.home"), url: "/" },
            { name: categoryName, url: categoryPath },
          ]),
          collectionJsonLd({
            name: categoryName,
            description: truncateDescription(descriptionOf(category, t.locale)),
            url: categoryPath,
            inLanguage: t.locale,
          }),
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: categoryName }]}
        title={categoryName}
        description={descriptionOf(category, t.locale)}
        aside={
          <ImagePlaceholder
            seed={category.id}
            icon={getCategoryIcon(category.slug)}
            label={categoryName}
            imageUrl={category.image_url || null}
            sizes="(min-width: 1024px) 420px, 100vw"
            eager
            aspectClassName="aspect-[21/9] lg:aspect-video"
          />
        }
      />
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
