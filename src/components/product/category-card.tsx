import Link from "next/link"

import type { CategoryWithCount } from "@/lib/services/catalog"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"

function CategoryCard({ category }: { category: CategoryWithCount }) {
  const Icon = getCategoryIcon(category.slug)

  return (
    <Link href={`/category/${category.slug}`} className="group block">
      <ImagePlaceholder
        seed={category.id}
        icon={Icon}
        label={category.name_en}
        imageUrl={category.image_url || null}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium text-charcoal group-hover:text-burgundy">
          {category.name_en}
        </p>
        <p className="text-xs text-muted-text">{category.productCount} products</p>
      </div>
    </Link>
  )
}

export { CategoryCard }
