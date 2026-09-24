import type { Metadata } from "next"

import { getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { getCategories } from "@/lib/services/catalog-queries"
import { CategoryCard } from "@/components/product/category-card"
import { PageHeader } from "@/components/layout/page-header"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/categories",
    title: t("catalog.categoriesTitle"),
    description: t("catalog.categoriesSubtitle"),
  })
}

// The primary navigation, the footer and the hero all link to /categories.
export default async function CategoriesPage() {
  const [categories, t] = await Promise.all([getCategories(), getT()])

  return (
    <div className="space-y-8 py-6 lg:py-8">
      <PageHeader
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("catalog.categoriesTitle") }]}
        title={t("catalog.categoriesTitle")}
        description={t("catalog.categoriesSubtitle")}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            sizes="(min-width: 1280px) 290px, (min-width: 1024px) 24vw, (min-width: 640px) 31vw, 47vw"
          />
        ))}
      </div>
    </div>
  )
}
