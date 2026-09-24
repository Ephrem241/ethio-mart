import {
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getDealsSummary,
} from "@/lib/services/catalog-queries"
import { getHomepageSettings } from "@/lib/services/homepage-queries"
import { fillDealTokens, localizeHomepage } from "@/lib/services/homepage"
import type { Metadata } from "next"

import { getLocale, getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { SITE_NAME } from "@/lib/seo/site"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld"
import { JsonLd } from "@/components/seo/json-ld"
import { Hero } from "@/components/home/hero"
import { CategorySection } from "@/components/home/category-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { DealsBanner } from "@/components/home/deals-banner"
import { NewArrivals } from "@/components/home/new-arrivals"
import { TrustSection } from "@/components/home/trust-section"
import { LifestyleBanner } from "@/components/home/lifestyle-banner"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/",
    socialTitle: t("meta.title", { brand: SITE_NAME }),
    description: t("meta.description"),
  })
}

// The homepage, in the order a shopper reads it: hero, categories, featured
// products, special deals, new arrivals, why us, the closing banner (the footer
// follows from the layout). Everything is read from the database — the copy,
// the categories, the products and the size of the deal.
export default async function Home() {
  const [locale, categories, featured, newArrivals, deals, rawSettings] = await Promise.all([
    getLocale(),
    getCategories(),
    getFeaturedProducts(6),
    getNewArrivals(10),
    getDealsSummary(),
    getHomepageSettings(),
  ])
  const settings = localizeHomepage(rawSettings, locale)
  const t = await getT()

  return (
    <div className="space-y-12 py-6 sm:space-y-16 lg:space-y-20 lg:py-10">
      <JsonLd nodes={[organizationJsonLd(t("meta.description")), websiteJsonLd(locale)]} />
      <Hero settings={settings} />
      <CategorySection categories={categories} />
      <FeaturedProducts products={featured} />
      {/* No discounted product, no deals banner: it would have nothing to point at. */}
      {deals.count > 0 && <DealsBanner settings={fillDealTokens(settings, deals.maxDiscountPercent)} />}
      <NewArrivals products={newArrivals} />
      <TrustSection />
      <LifestyleBanner />
    </div>
  )
}
