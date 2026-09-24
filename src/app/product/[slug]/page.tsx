import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { categoryNameOf, descriptionOf, nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import { pageMetadata, pagePath, truncateDescription } from "@/lib/seo/metadata"
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld"
import { JsonLd } from "@/components/seo/json-ld"
import Link from "next/link"

import { getStockStatus, isOnSale } from "@/lib/services/catalog"
import { getProductBySlug } from "@/lib/services/catalog-queries"
import { Breadcrumb } from "@/components/navigation/breadcrumb"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductPurchaseActions } from "@/components/product/product-purchase-actions"
import { ProductDetailsSection } from "@/components/product/product-details-section"
import { ProductDeliverySection } from "@/components/product/product-delivery-section"
import { ProductReviewsSection } from "@/components/product/product-reviews-section"
import { MobilePurchaseBar } from "@/components/product/mobile-purchase-bar"
import { Price } from "@/components/product/price"
import { DiscountBadge } from "@/components/product/discount-badge"
import { Rating } from "@/components/product/rating"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [product, t] = await Promise.all([getProductBySlug(slug), getT()])
  if (!product) return { title: t("catalog.productNotFound") }

  const name = nameOf(product, t.locale)
  return pageMetadata({
    locale: t.locale,
    path: `/product/${product.slug}`,
    title: name,
    description: truncateDescription(descriptionOf(product, t.locale)),
    image: product.image_url ? { url: product.image_url, alt: name } : null,
  })
}

// No loading.tsx in this segment on purpose: it would create an implicit
// Suspense boundary that starts streaming a 200 before notFound() below can
// resolve, permanently locking in the wrong status (same fix applied to
// category/[slug] last phase).
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [product, t] = await Promise.all([getProductBySlug(slug), getT()])
  if (!product) notFound()

  const hasDiscount = isOnSale(product)
  const stock = getStockStatus(product.stock, t)
  const name = nameOf(product, t.locale)
  const categoryName = categoryNameOf(product, t.locale)
  const productPath = `/product/${product.slug}`

  return (
    <div className="space-y-8 py-6 pb-32 lg:space-y-10 lg:py-8 lg:pb-8">
      <JsonLd
        nodes={[
          productJsonLd({
            product,
            name,
            description: truncateDescription(descriptionOf(product, t.locale), 500),
            url: pagePath(productPath, t.locale),
            categoryName,
          }),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: "/" },
            { name: categoryName, url: `/category/${product.categorySlug}` },
            { name, url: productPath },
          ]),
        ]}
      />

      <Breadcrumb
        items={[
          { label: t("nav.home"), href: "/" },
          { label: categoryName, href: `/category/${product.categorySlug}` },
          { label: name },
        ]}
      />

      {/* [&>*]:min-w-0 — a grid item defaults to its content's minimum width, so
          without it one wide child (a price, a button row) widens the whole
          column past a small screen. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 [&>*]:min-w-0">
        <ProductGallery
          productId={product.id}
          productName={name}
          categorySlug={product.categorySlug}
          imageUrls={product.image_urls ?? (product.image_url ? [product.image_url] : [])}
        />

        <div className="space-y-6 lg:pt-2">
          <div className="space-y-3">
            <Link
              href={`/category/${product.categorySlug}`}
              className="text-xs font-semibold tracking-[0.16em] text-forest uppercase underline-offset-4 hover:underline"
            >
              {categoryName}
            </Link>
            <h1 className="font-display text-3xl leading-tight font-semibold text-charcoal sm:text-4xl">{name}</h1>
            {product.rating != null && <Rating value={product.rating} t={t} />}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Price amount={product.price} t={t} className="text-3xl" />
            {hasDiscount && <Price amount={product.compare_at_price!} t={t} variant="compare" className="text-base" />}
            <DiscountBadge price={product.price} compareAtPrice={product.compare_at_price} />
          </div>

          <p className={`flex items-center gap-2 text-sm font-medium ${stock.className}`}>
            <span aria-hidden className="size-2 rounded-full bg-current" />
            {stock.label}
          </p>

          <p className="leading-relaxed text-muted-text">{descriptionOf(product, t.locale)}</p>
          <ProductPurchaseActions product={product} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProductDetailsSection product={product} />
        <ProductDeliverySection />
      </div>
      <ProductReviewsSection product={product} />

      <MobilePurchaseBar product={product} />
    </div>
  )
}
