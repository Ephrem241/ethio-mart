import Link from "next/link"
import { cn } from "cn"

import type { ProductWithCategory } from "@/lib/services/catalog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"
import { FavoriteButton } from "@/components/product/favorite-button"
import { Price } from "@/components/product/price"
import { DiscountBadge } from "@/components/product/discount-badge"
import { Rating } from "@/components/product/rating"

function ProductCard({
  product,
  badge,
  className,
}: {
  product: ProductWithCategory
  badge?: string
  className?: string
}) {
  const Icon = getCategoryIcon(product.categorySlug)
  const href = `/product/${product.slug}`
  const hasDiscount = !!product.compare_at_price && product.compare_at_price > product.price

  return (
    <Card className={cn("group gap-3 overflow-hidden py-0", className)}>
      <div className="relative">
        <Link href={href} className="block">
          <ImagePlaceholder
            seed={product.id}
            icon={Icon}
            label={product.name_en}
            imageUrl={product.image_url}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {/* FavoriteButton is a sibling of the Link (not nested inside it) —
            a <button> inside an <a> is invalid HTML and unreliable for
            keyboard/screen-reader users. */}
        <FavoriteButton productId={product.id} className="absolute top-3 right-3 z-10" />
        {badge && (
          <Badge variant="destructive" className="absolute top-3 left-3 z-10">
            {badge}
          </Badge>
        )}
      </div>

      <Link href={href} className="block">
        <CardContent className="space-y-1.5 pt-3 pb-4">
          <p className="line-clamp-1 text-sm font-medium text-charcoal group-hover:text-burgundy">
            {product.name_en}
          </p>
          <p className="text-xs text-muted-text">{product.categoryName}</p>
          {product.rating != null && <Rating value={product.rating} />}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Price amount={product.price} />
            {hasDiscount && <Price amount={product.compare_at_price!} variant="compare" />}
            <DiscountBadge price={product.price} compareAtPrice={product.compare_at_price} />
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export { ProductCard }
