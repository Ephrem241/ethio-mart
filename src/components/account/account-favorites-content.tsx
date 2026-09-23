"use client"

import Link from "next/link"
import { HeartOff } from "lucide-react"

import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useFavoritesStore } from "@/lib/store/favorites"
import { resolveFavoriteProducts } from "@/lib/favorites-math"
import { useProductsByIds } from "@/lib/hooks/use-products-by-ids"
import { FavoriteProductCard } from "@/components/account/favorite-product-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

function AccountFavoritesContent() {
  const { user, ready } = useRequireAuth("/login?redirect=/account/favorites")
  const hasHydrated = useFavoritesStore((s) => s.hasHydrated)
  const ids = useFavoritesStore((s) => s.ids)
  const { products: loadedProducts, loading } = useProductsByIds(ids)

  if (!ready || !user || !hasHydrated || loading) return null

  const products = resolveFavoriteProducts(ids, loadedProducts)

  if (products.length === 0) {
    return (
      <EmptyState
        icon={HeartOff}
        title="No favorites yet."
        description="Save products you love — tap the heart on any product."
        action={
          <Button asChild>
            <Link href="/shop">Browse products</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {products.map((product) => (
        <FavoriteProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export { AccountFavoritesContent }
