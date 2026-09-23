"use client"

import type { ProductWithCategory } from "@/lib/services/catalog"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"

function FavoriteProductCard({ product }: { product: ProductWithCategory }) {
  const addToCart = useAddToCart()
  const outOfStock = product.stock <= 0

  return (
    <div className="space-y-2">
      <ProductCard product={product} />
      <Button
        className="w-full"
        size="sm"
        disabled={outOfStock}
        onClick={() => addToCart(product.id)}
      >
        {outOfStock ? "Out of stock" : "Add to cart"}
      </Button>
    </div>
  )
}

export { FavoriteProductCard }
