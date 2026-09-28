import { getT } from "@/lib/i18n/server"
import type { CategoryWithCount } from "@/lib/services/catalog"
import { CategoryCard } from "@/components/product/category-card"
import { CategoryChip } from "@/components/product/category-chip"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/home/section-heading"

// One row of six on a wide screen (five on a laptop). The rest of the
// categories are one click away via "View All" there.
const VISIBLE = 6

async function CategorySection({ categories }: { categories: CategoryWithCount[] }) {
  if (categories.length === 0) return null
  const t = await getT()

  return (
    <Reveal>
      <section aria-labelledby="categories-heading" className="space-y-6">
        <SectionHeading
          id="categories-heading"
          title={t("home.categoriesTitle")}
          href="/categories"
          linkLabel={t("home.viewAll")}
        />
        {/* Phones: every category as a circular-icon chip in one swipeable
            row — nothing capped, since a chip is cheap enough to show them
            all instead of only six with a "View All" click. */}
        <div
          role="region"
          aria-label={t("home.carousel.rail", { title: t("home.categoriesTitle") })}
          tabIndex={0}
          className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:gap-4 lg:hidden"
        >
          {categories.map((category) => (
            <CategoryChip key={category.id} category={category} t={t} />
          ))}
        </div>
        <div className="hidden gap-4 lg:grid lg:grid-cols-6">
          {categories.slice(0, VISIBLE).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </Reveal>
  )
}

export { CategorySection }
