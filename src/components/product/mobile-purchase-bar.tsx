"use client"

import { useT } from "@/lib/i18n/provider"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/product/price"

// Stacked directly above BottomNav (fixed, h-16, bottom-0) — bottom-16 here
// means this bar starts exactly where BottomNav begins, so the two never
// overlap. Kept to a single action (no quantity/Buy Now/favorite) so it
// doesn't become a second, competing purchase-actions cluster.
function MobilePurchaseBar({ product }: { product: ProductWithCategory }) {
  const t = useT()
  const addToCart = useAddToCart()
  const outOfStock = product.stock <= 0

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 p-3 shadow-[0_-8px_24px_-12px_rgb(23_23_23/0.18)] backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <Price amount={product.price} t={t} className="text-lg" />
        <Button size="lg" disabled={outOfStock} onClick={() => addToCart(product.id, 1)} className="flex-1">
          {outOfStock ? t("product.stock.out") : t("product.addToCart")}
        </Button>
      </div>
    </div>
  )
}

export { MobilePurchaseBar }
