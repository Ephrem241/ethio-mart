import type { Metadata } from "next"
import Link from "next/link"

import { BRAND_NAME } from "@/lib/brand"
import { nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { getNavCategories } from "@/lib/services/nav-queries"
import { Button } from "@/components/ui/button"
import { InfoPage, InfoSection } from "@/components/info/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/about",
    title: t("info.about.title"),
    description: t("info.about.subtitle", { brand: BRAND_NAME }),
  })
}

// What the shop is and how it works, in the terms the store really operates on
// — no founding year, team size or delivery claims that nobody has supplied.
// The "what you'll find" list is the shop's own categories.
export default async function AboutPage() {
  const [t, categories] = await Promise.all([getT(), getNavCategories()])

  return (
    <InfoPage title={t("info.about.title")} description={t("info.about.subtitle", { brand: BRAND_NAME })}>
      <InfoSection title={t("info.about.whatTitle")}>
        <p>{t("info.about.whatText")}</p>
      </InfoSection>

      {categories.length > 0 && (
        <InfoSection title={t("info.about.findTitle")}>
          <ul className="flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="inline-block rounded-full border border-sand bg-white px-4 py-2 text-sm font-medium text-charcoal outline-none transition-colors hover:border-forest hover:text-forest focus-visible:ring-2 focus-visible:ring-forest/40"
                >
                  {nameOf(category, t.locale)}
                </Link>
              </li>
            ))}
          </ul>
        </InfoSection>
      )}

      <InfoSection title={t("info.about.howTitle")}>
        <p>{t("info.about.howText")}</p>
      </InfoSection>

      <InfoSection title={t("info.about.languageTitle")}>
        <p>{t("info.about.languageText")}</p>
      </InfoSection>

      <div>
        <Button size="lg" asChild>
          <Link href="/shop">{t("info.common.startShopping")}</Link>
        </Button>
      </div>
    </InfoPage>
  )
}
