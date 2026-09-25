import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import type { CategoryWithCount } from "@/lib/services/catalog"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"

// A photo card: the category's picture inset in a white card, its name, and a
// "Shop Now →" line. Used on the home page (a row of six) and on /categories.
async function CategoryCard({
  category,
  sizes = "(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw",
}: {
  category: CategoryWithCount
  /** How wide the photo really is on screen (an HTML `sizes` value). */
  sizes?: string
}) {
  const t = await getT()
  const Icon = getCategoryIcon(category.slug)
  const name = nameOf(category, t.locale)

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block overflow-hidden rounded-card border border-border/70 bg-card p-2 shadow-soft transition-[box-shadow,transform] duration-300 outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="overflow-hidden rounded-image">
        <ImagePlaceholder
          seed={category.id}
          icon={Icon}
          label={name}
          imageUrl={category.image_url || null}
          sizes={sizes}
          aspectClassName="aspect-[4/3]"
          className="transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1 px-2 pt-3 pb-2">
        <p className="line-clamp-1 font-display text-[15px] font-semibold text-charcoal">{name}</p>
        <p className="flex items-center gap-1 text-xs font-medium text-muted-text transition-colors group-hover:text-forest">
          {t("home.categoryShopNow")}
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  )
}

export { CategoryCard }
