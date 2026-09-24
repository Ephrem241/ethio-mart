"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"

import { categoryNameOf, nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
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
  const t = useT()
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const Icon = getCategoryIcon(product.categorySlug)
  const hasDiscount = isOnSale(product)
  const lineSubtotal = product.price * line.quantity
  const name = nameOf(product, t.locale)

  return (
    <div className="flex gap-4 rounded-card border border-border/70 bg-card p-3 shadow-soft sm:p-4">
      <Link href={`/product/${product.slug}`} className="w-24 shrink-0 self-start sm:w-28">
        <ImagePlaceholder seed={product.id} icon={Icon} label={name} imageUrl={product.image_url} sizes="96px" />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${product.slug}`}
              className="font-medium text-charcoal hover:text-forest"
            >
              {name}
            </Link>
            <p className="text-xs text-muted-text">{categoryNameOf(product, t.locale)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeItem(product.id)}
            aria-label={t("cart.removeItem", { name })}
          >
            <Trash2 />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Price amount={product.price} t={t} />
          {hasDiscount && <Price amount={product.compare_at_price!} t={t} variant="compare" />}
          <DiscountBadge price={product.price} compareAtPrice={product.compare_at_price} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuantitySelector
            value={line.quantity}
            onChange={(q) => setQuantity(product.id, q)}
            max={product.stock}
          />
          <Price amount={lineSubtotal} t={t} />
        </div>
      </div>
    </div>
  )
}

export { CartLineItem }
