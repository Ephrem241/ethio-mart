import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductCard } from "@/components/product/product-card"

// Always used from Server Components, so it can fetch the translator itself.
async function ProductGrid({
  products,
  badge,
  eagerCount = 0,
}: {
  products: ProductWithCategory[]
  badge?: string
  // How many of the first cards are visible without scrolling (their photos
  // load immediately; the rest load as the shopper scrolls to them).
  eagerCount?: number
}) {
  const t = await getT()

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} t={t} badge={badge} eager={index < eagerCount} />
      ))}
    </div>
  )
}

export { ProductGrid }
