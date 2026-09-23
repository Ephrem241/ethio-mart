import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductGrid } from "@/components/product/product-grid"

function FlashDeals({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null

  return (
    <section id="flash-deals" className="scroll-mt-20 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-charcoal">Flash deals</h2>
        <p className="text-muted-text">Limited-time offers on selected products.</p>
      </div>
      <ProductGrid products={products} badge="FLASH SALE" />
    </section>
  )
}

export { FlashDeals }
