import { getT } from "@/lib/i18n/server"
import type { CategoryWithCount } from "@/lib/services/catalog"
import { CategoryCard } from "@/components/product/category-card"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/home/section-heading"

// One row of six on a wide screen (five on a laptop, three on a tablet, two
// on a phone). The rest of the categories are one click away via "View All".
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.slice(0, VISIBLE).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </Reveal>
  )
}

export { CategorySection }
