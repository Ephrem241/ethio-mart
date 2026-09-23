import Link from "next/link"

import type { ResolvedCartLine } from "@/lib/cart-math"
import { getCategoryIcon } from "@/components/product/category-icons"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { Price } from "@/components/product/price"

// A dumb, read-only row for the checkout review — CartLineItem owns
// mutation hooks (setQuantity/removeItem) that have no business being
// reachable mid-checkout, so this is a small separate component rather than
// branching that one to hide its own interactive bits.
function CheckoutOrderItem({ line, product }: ResolvedCartLine) {
  const Icon = getCategoryIcon(product.categorySlug)

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Link href={`/product/${product.slug}`} className="w-14 shrink-0">
        <ImagePlaceholder seed={product.id} icon={Icon} label={product.name_en} imageUrl={product.image_url} />
      </Link>
      <div className="flex-1">
        <p className="text-sm font-medium text-charcoal">{product.name_en}</p>
        <p className="text-xs text-muted-text">Qty {line.quantity}</p>
      </div>
      <Price amount={product.price * line.quantity} />
    </div>
  )
}

export { CheckoutOrderItem }
