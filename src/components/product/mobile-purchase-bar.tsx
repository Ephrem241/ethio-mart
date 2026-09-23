"use client"

import type { ProductWithCategory } from "@/lib/services/catalog"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/product/price"

// Stacked directly above BottomNav (fixed, h-16, bottom-0) — bottom-16 here
// means this bar starts exactly where BottomNav begins, so the two never
// overlap. Kept to a single action (no quantity/Buy Now/favorite) so it
// doesn't become a second, competing purchase-actions cluster.
function MobilePurchaseBar({ product }: { product: ProductWithCategory }) {
  const addToCart = useAddToCart()
  const outOfStock = product.stock <= 0

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Price amount={product.price} />
        <Button disabled={outOfStock} onClick={() => addToCart(product.id, 1)} className="flex-1">
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </div>
  )
}

export { MobilePurchaseBar }
