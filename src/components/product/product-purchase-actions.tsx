"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useT } from "@/lib/i18n/provider"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { useCartStore } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "@/components/product/quantity-selector"
import { FavoriteButton } from "@/components/product/favorite-button"
import { MobilePurchaseBar } from "@/components/product/mobile-purchase-bar"

function ProductPurchaseActions({ product }: { product: ProductWithCategory }) {
  const t = useT()
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()
  const addToCart = useAddToCart()
  const addItem = useCartStore((s) => s.addItem)
  const outOfStock = product.stock <= 0

  function handleAddToCart() {
    addToCart(product.id, quantity)
  }

  function handleBuyNow() {
    addItem(product.id, quantity)
    router.push("/cart")
  }

  return (
    <div className="space-y-3 max-lg:space-y-0">
      {/* Phones and tablets: the two buy buttons live in a bar pinned to the
          bottom of the screen instead (fixed, so it takes no room here; it
          comes first so that it is never the "last child" `space-y` spaces). */}
      <MobilePurchaseBar outOfStock={outOfStock} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
      {/* Quantity and the heart share a row; the two buy buttons get a row of
          their own, in equal columns that may shrink (min-w-0) — three things
          side by side did not fit a 320px screen. */}
      <div className="flex items-center justify-between gap-3">
        {!outOfStock && (
          <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} className="h-12" />
        )}
        <FavoriteButton productId={product.id} className="ml-auto size-12 shrink-0 border border-border shadow-none" />
      </div>
      <div className="hidden grid-cols-2 gap-2.5 lg:grid">
        <Button size="lg" className="min-w-0 px-3" disabled={outOfStock} onClick={handleAddToCart}>
          {outOfStock ? t("product.stock.out") : t("product.addToCart")}
        </Button>
        <Button size="lg" variant="outline" className="min-w-0 px-3" disabled={outOfStock} onClick={handleBuyNow}>
          {t("product.buyNow")}
        </Button>
      </div>
    </div>
  )
}

export { ProductPurchaseActions }
