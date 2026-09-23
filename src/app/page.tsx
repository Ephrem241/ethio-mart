import {
  getCategories,
  getFeaturedProducts,
  getPopularProducts,
  getFlashDeals,
} from "@/lib/services/catalog-queries"
import { getHomepageSettings } from "@/lib/services/homepage-queries"
import { Hero } from "@/components/home/hero"
import { CategorySection } from "@/components/home/category-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { PromoBanner } from "@/components/home/promo-banner"
import { PopularProducts } from "@/components/home/popular-products"
import { FlashDeals } from "@/components/home/flash-deals"
import { TrustSection } from "@/components/home/trust-section"
import { Newsletter } from "@/components/home/newsletter"

export default async function Home() {
  const [categories, featured, popular, flashDeals, settings] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getPopularProducts(),
    getFlashDeals(),
    getHomepageSettings(),
  ])

  return (
    <div className="space-y-16 py-8 lg:space-y-24 lg:py-12">
      <Hero settings={settings} />
      <CategorySection categories={categories} />
      <FeaturedProducts products={featured} />
      <PromoBanner settings={settings} />
      <PopularProducts products={popular} />
      <FlashDeals products={flashDeals} />
      <TrustSection />
      <Newsletter />
    </div>
  )
}
