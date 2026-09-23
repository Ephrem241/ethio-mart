import { notFound } from "next/navigation"

import { isOnSale } from "@/lib/services/catalog"
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
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const hasDiscount = isOnSale(product)

  return (
    <div className="space-y-10 py-8 pb-28 lg:pb-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: product.categoryName, href: `/category/${product.categorySlug}` },
          { label: product.name_en },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          productId={product.id}
          productName={product.name_en}
          categorySlug={product.categorySlug}
          imageUrl={product.image_url}
        />

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-charcoal">{product.name_en}</h1>
          {product.rating != null && <Rating value={product.rating} />}
          <div className="flex flex-wrap items-center gap-2">
            <Price amount={product.price} />
            {hasDiscount && <Price amount={product.compare_at_price!} variant="compare" />}
            <DiscountBadge price={product.price} compareAtPrice={product.compare_at_price} />
          </div>
          <p className="text-muted-text">{product.description_en}</p>
          <ProductPurchaseActions product={product} />
        </div>
      </div>

      <ProductDetailsSection product={product} />
      <ProductDeliverySection />
      <ProductReviewsSection product={product} />

      <MobilePurchaseBar product={product} />
    </div>
  )
}
