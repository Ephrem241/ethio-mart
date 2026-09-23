"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"

import type { CartLine } from "@/lib/store/cart"
import { useCartStore } from "@/lib/store/cart"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { isOnSale } from "@/lib/services/catalog"
import { getCategoryIcon } from "@/components/product/category-icons"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { Price } from "@/components/product/price"
import { DiscountBadge } from "@/components/product/discount-badge"
import { QuantitySelector } from "@/components/product/quantity-selector"
import { Button } from "@/components/ui/button"

function CartLineItem({ line, product }: { line: CartLine; product: ProductWithCategory }) {
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const Icon = getCategoryIcon(product.categorySlug)
  const hasDiscount = isOnSale(product)
  const lineSubtotal = product.price * line.quantity

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-b-0">
      <Link href={`/product/${product.slug}`} className="w-20 shrink-0 sm:w-24">
        <ImagePlaceholder seed={product.id} icon={Icon} label={product.name_en} />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${product.slug}`}
              className="font-medium text-charcoal hover:text-burgundy"
            >
              {product.name_en}
            </Link>
            <p className="text-xs text-muted-text">{product.categoryName}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeItem(product.id)}
            aria-label={`Remove ${product.name_en} from cart`}
          >
            <Trash2 />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Price amount={product.price} />
          {hasDiscount && <Price amount={product.compare_at_price!} variant="compare" />}
          <DiscountBadge price={product.price} compareAtPrice={product.compare_at_price} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuantitySelector
            value={line.quantity}
            onChange={(q) => setQuantity(product.id, q)}
            max={product.stock}
          />
          <Price amount={lineSubtotal} />
        </div>
      </div>
    </div>
  )
}

export { CartLineItem }
