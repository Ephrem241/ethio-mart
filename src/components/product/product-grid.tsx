import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductCard } from "@/components/product/product-card"

function ProductGrid({
  products,
  badge,
}: {
  products: ProductWithCategory[]
  badge?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} badge={badge} />
      ))}
    </div>
  )
}

export { ProductGrid }
