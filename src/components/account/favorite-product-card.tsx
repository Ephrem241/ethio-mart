"use client"

import { useT } from "@/lib/i18n/provider"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"

function FavoriteProductCard({ product }: { product: ProductWithCategory }) {
  const t = useT()
  const addToCart = useAddToCart()
  const outOfStock = product.stock <= 0

  return (
    <div className="space-y-2">
      <ProductCard product={product} t={t} />
      <Button
        className="w-full"
        size="sm"
        disabled={outOfStock}
        onClick={() => addToCart(product.id)}
      >
        {outOfStock ? t("product.stock.out") : t("product.addToCart")}
      </Button>
    </div>
  )
}

export { FavoriteProductCard }
