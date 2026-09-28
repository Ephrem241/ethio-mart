import Link from "next/link"
import { cn } from "cn"

import { categoryNameOf, nameOf } from "@/lib/i18n/content"
import type { Translator } from "@/lib/i18n/translator"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"
import { AddToCartButton } from "@/components/product/add-to-cart-button"
import { FavoriteButton } from "@/components/product/favorite-button"
import { Price } from "@/components/product/price"
import { DiscountBadge } from "@/components/product/discount-badge"
import { Rating } from "@/components/product/rating"

// Renders on the server (shop, home) and in the browser (favorites) alike:
// it takes the translator as a prop instead of reading it from context, which
// is what lets it stay a Server Component. Only the heart and the Add to Cart
// button are client islands, so a grid of 24 cards hydrates 48 small buttons —
// not 24 whole cards, each with the full product record serialized into the page.
//
// Phones and tablets (below `lg`) get a compact, shopping-app card: the photo
// edge to edge, a smaller heart (with a full 44px tap area), no category line,
// and the price with a round Add to Cart button beside it instead of a
// full-width button row. Every such rule is `max-lg:` (or undone with `lg:`),
// so the desktop card is exactly as it was.
function ProductCard({
  product,
  t,
  badge,
  eager,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  className,
}: {
  product: ProductWithCategory
  t: Translator
  badge?: string
  // The card is among the first things on screen: load its photo right away.
  eager?: boolean
  /** How wide the photo really is on screen (an HTML `sizes` value). The
   * default fits the 4-column shop grid; a wider or narrower grid should say so. */
  sizes?: string
  className?: string
}) {
  const Icon = getCategoryIcon(product.categorySlug)
  const href = `/product/${product.slug}`
  const name = nameOf(product, t.locale)

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-border/70 bg-card shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        className
      )}
    >
      <div className="relative p-2 pb-0 max-lg:p-0">
        <Link href={href} className="block overflow-hidden rounded-image transition-opacity max-lg:rounded-none max-lg:active:opacity-80">
          <ImagePlaceholder
            seed={product.id}
            icon={Icon}
            label={name}
            imageUrl={product.image_url}
            sizes={sizes}
            eager={eager}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {/* The badges and the heart are siblings of the Link (not nested inside
            it) — a <button> inside an <a> is invalid HTML and unreliable for
            keyboard/screen-reader users. */}
        <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5 max-lg:top-2 max-lg:left-2">
          <DiscountBadge price={product.price} compareAtPrice={product.compare_at_price} />
          {badge && (
            <span className="inline-flex h-6 items-center rounded-lg bg-forest px-2 text-[11px] font-semibold tracking-wide text-white">
              {badge}
            </span>
          )}
        </div>
        {/* Phones: a 32px heart whose invisible ::after reaches the 44px tap size. */}
        <FavoriteButton
          productId={product.id}
          className="absolute top-4 right-4 z-10 max-lg:top-2 max-lg:right-2 max-lg:size-8 max-lg:after:absolute max-lg:after:-inset-1.5"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5 pt-3 max-lg:gap-1.5 max-lg:p-2.5">
        <div className="space-y-1 max-lg:space-y-0">
          <Link
            href={href}
            className="line-clamp-2 text-sm leading-5 font-medium text-charcoal transition-colors group-hover:text-forest"
          >
            {name}
          </Link>
          <p className="text-xs text-muted-text max-lg:hidden">{categoryNameOf(product, t.locale)}</p>
        </div>
        {product.rating != null && <Rating value={product.rating} t={t} />}
        {/* Phones: the price and the round Add to Cart button share one row.
            From `lg` this wrapper is `display: contents` — no box of its own —
            so the price row and the full-width button stack as they always did. */}
        <div className="mt-auto flex items-center gap-2 pt-1 lg:contents">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 max-lg:min-w-0 max-lg:flex-1 lg:mt-auto lg:pt-1">
            <Price amount={product.price} t={t} className="text-[15px]" />
            {!!product.compare_at_price && product.compare_at_price > product.price && (
              <Price amount={product.compare_at_price} t={t} variant="compare" className="text-xs" />
            )}
          </div>
          <AddToCartButton productId={product.id} outOfStock={product.stock <= 0} className="mt-1 w-full max-lg:mt-0" />
        </div>
      </div>
    </article>
  )
}

export { ProductCard }
