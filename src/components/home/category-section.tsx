import Link from "next/link"

import type { CategoryWithCount } from "@/lib/services/catalog"
import { CategoryCard } from "@/components/product/category-card"

function CategorySection({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-charcoal">Shop by category</h2>
          <p className="text-muted-text">Explore products made for everyday life.</p>
        </div>
        <Link
          href="/categories"
          className="shrink-0 text-sm font-medium text-burgundy hover:underline"
        >
          View all categories
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}

export { CategorySection }
