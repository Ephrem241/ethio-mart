"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import type { ProductWithCategory } from "@/lib/services/catalog"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { useCartStore } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "@/components/product/quantity-selector"
import { FavoriteButton } from "@/components/product/favorite-button"

function ProductPurchaseActions({ product }: { product: ProductWithCategory }) {
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
    <div className="space-y-4">
      {!outOfStock && (
        <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} />
      )}
      <div className="flex items-center gap-2">
        <Button className="flex-1" disabled={outOfStock} onClick={handleAddToCart}>
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
        <Button variant="outline" className="flex-1" disabled={outOfStock} onClick={handleBuyNow}>
          Buy now
        </Button>
        <FavoriteButton productId={product.id} className="shrink-0" />
      </div>
    </div>
  )
}

export { ProductPurchaseActions }
