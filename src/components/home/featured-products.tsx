import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductCard } from "@/components/product/product-card"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/home/section-heading"

// Six products: one row on a wide screen. On a laptop (five columns) the sixth
// is hidden rather than left orphaned on a second row.
const VISIBLE = 6
const CARD_SIZES = "(min-width: 1280px) 190px, (min-width: 1024px) 19vw, (min-width: 640px) 31vw, 47vw"

async function FeaturedProducts({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null
  const t = await getT()

  return (
    <Reveal>
      <section aria-labelledby="featured-heading" className="space-y-6">
        <SectionHeading
          id="featured-heading"
          title={t("home.featuredTitle")}
          href="/shop"
          linkLabel={t("home.viewAll")}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6 [&>*:nth-child(6)]:lg:max-xl:hidden">
          {products.slice(0, VISIBLE).map((product) => (
            <ProductCard key={product.id} product={product} t={t} sizes={CARD_SIZES} />
          ))}
        </div>
      </section>
    </Reveal>
  )
}

export { FeaturedProducts }
