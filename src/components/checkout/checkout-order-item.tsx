"use client"

import Link from "next/link"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
import type { ResolvedCartLine } from "@/lib/cart-math"
import { getCategoryIcon } from "@/components/product/category-icons"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { Price } from "@/components/product/price"

// A dumb, read-only row for the checkout review — CartLineItem owns
// mutation hooks (setQuantity/removeItem) that have no business being
// reachable mid-checkout, so this is a small separate component rather than
// branching that one to hide its own interactive bits.
function CheckoutOrderItem({ line, product }: ResolvedCartLine) {
  const t = useT()
  const Icon = getCategoryIcon(product.categorySlug)
  const name = nameOf(product, t.locale)

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Link href={`/product/${product.slug}`} className="w-14 shrink-0">
        <ImagePlaceholder seed={product.id} icon={Icon} label={name} imageUrl={product.image_url} sizes="56px" />
      </Link>
      <div className="flex-1">
        <p className="text-sm font-medium text-charcoal">{name}</p>
        <p className="text-xs text-muted-text">{t("checkout.review.qty", { count: line.quantity })}</p>
      </div>
      <Price amount={product.price * line.quantity} t={t} />
    </div>
  )
}

export { CheckoutOrderItem }
