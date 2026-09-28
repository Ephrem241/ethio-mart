import {
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getDealsSummary,
  getFlashDeals,
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
import { MobileHomeCarousel } from "@/components/home/mobile-home-carousel"
import { DealsSlide, LifestyleSlide } from "@/components/home/mobile-home-slides"
import { CategorySection } from "@/components/home/category-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { DealsBanner } from "@/components/home/deals-banner"
import { DealsRow } from "@/components/home/deals-row"
import { NewArrivals } from "@/components/home/new-arrivals"
import { TrustSection } from "@/components/home/trust-section"
import { LifestyleBanner } from "@/components/home/lifestyle-banner"
import { PaymentMethods } from "@/components/home/payment-methods"

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
// products, special deals, new arrivals, why us, the closing banner and the
// ways to pay (the footer follows from the layout). Everything is read from
// the database — the copy, the categories, the products and the size of the
// deal. The hero is full-bleed: it breaks out of the layout's Container and
// cancels this wrapper's top padding itself.
//
// Phones: the hero, special-deals and lifestyle banners become one swipeable
// carousel at the top instead of three sections spread down the page — same
// copy, pictures and links, presented the way a shopping app would (the two
// promo banners as full-slide versions, see mobile-home-slides.tsx). Desktop
// keeps them exactly where they are today (the `hidden lg:block` wrappers).
export default async function Home() {
  const [locale, categories, featured, newArrivals, deals, flashDeals, rawSettings] = await Promise.all([
    getLocale(),
    getCategories(),
    getFeaturedProducts(6),
    getNewArrivals(10),
    getDealsSummary(),
    getFlashDeals(10),
    getHomepageSettings(),
  ])
  const settings = localizeHomepage(rawSettings, locale)
  const t = await getT()
  // No discounted product, no deals banner: it would have nothing to point at.
  const dealSettings = deals.count > 0 ? fillDealTokens(settings, deals.maxDiscountPercent) : null

  return (
    // Phones get the tighter rhythm of a shopping app (32px between sections);
    // from `sm` up the spacing is as it was.
    <div className="space-y-8 py-6 sm:space-y-16 lg:space-y-20 lg:py-10">
      <JsonLd nodes={[organizationJsonLd(t("meta.description")), websiteJsonLd(locale)]} />

      {/* The page's one real <h1>, kept separate from the two Hero renders
          below (mobile carousel + desktop): each of those now draws the same
          headline as plain, aria-hidden text, since a second literal <h1>
          would exist in the DOM even while `display:none` — invalid
          regardless of which copy is visible at a given width. */}
      <h1 id="hero-heading" className="sr-only">
        {settings.heroHeadline}
      </h1>

      <div className="-mt-6 lg:hidden">
        <MobileHomeCarousel
          slides={[
            <Hero key="hero" settings={settings} showHeading={false} variant="slide" />,
            ...(dealSettings ? [<DealsSlide key="deals" settings={dealSettings} />] : []),
            <LifestyleSlide key="lifestyle" />,
          ]}
        />
      </div>
      <div className="hidden lg:block">
        <Hero settings={settings} showHeading={false} />
      </div>

      <CategorySection categories={categories} />
      <FeaturedProducts products={featured} />
      <DealsRow products={flashDeals} />
      {dealSettings && (
        <div className="hidden lg:block">
          <DealsBanner settings={dealSettings} />
        </div>
      )}
      <NewArrivals products={newArrivals} />
      <TrustSection />
      <div className="hidden lg:block">
        <LifestyleBanner />
      </div>
      <PaymentMethods />
    </div>
  )
}
