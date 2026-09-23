import Link from "next/link"

import type { ProductWithCategory } from "@/lib/services/catalog"
import { getStockStatus } from "@/lib/services/catalog"

function ProductDetailsSection({ product }: { product: ProductWithCategory }) {
  const stock = getStockStatus(product.stock)

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium text-charcoal">Details</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-text">SKU</dt>
        <dd className="text-charcoal">{product.sku}</dd>
        <dt className="text-muted-text">Category</dt>
        <dd>
          <Link
            href={`/category/${product.categorySlug}`}
            className="text-charcoal hover:text-burgundy"
          >
            {product.categoryName}
          </Link>
        </dd>
        <dt className="text-muted-text">Availability</dt>
        <dd className={stock.className}>{stock.label}</dd>
      </dl>
    </section>
  )
}

export { ProductDetailsSection }
