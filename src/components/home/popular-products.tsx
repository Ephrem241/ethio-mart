import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductGrid } from "@/components/product/product-grid"

function PopularProducts({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-charcoal">Popular right now</h2>
        <p className="text-muted-text">Customer favorites, updated regularly.</p>
      </div>
      <ProductGrid products={products} />
    </section>
  )
}

export { PopularProducts }
