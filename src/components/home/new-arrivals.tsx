import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductCard } from "@/components/product/product-card"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/home/section-heading"
import { CarouselControls } from "@/components/home/carousel-controls"

// Each card is a fixed share of the rail's width, chosen so the last visible
// card is always cut off a little — the peek is what tells a shopper (especially
// on a phone, where the arrows are hidden) that the rail scrolls.
const ITEM_WIDTH = "w-[44%] sm:w-[30%] lg:w-[23%] xl:w-[18.5%]"
const CARD_SIZES = "(min-width: 1280px) 220px, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 44vw"
const RAIL_ID = "new-arrivals-rail"

async function NewArrivals({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null
  const t = await getT()

  return (
    <Reveal>
      <section aria-labelledby="new-arrivals-heading" className="space-y-6">
        <SectionHeading
          id="new-arrivals-heading"
          title={t("home.newArrivalsTitle")}
          href="/shop?sort=newest"
          linkLabel={t("home.viewAll")}
          actions={<CarouselControls targetId={RAIL_ID} />}
        />
        {/* A scrollable region: focusable so the keyboard can scroll it. */}
        <div
          id={RAIL_ID}
          role="region"
          aria-label={t("home.newArrivalsTitle")}
          tabIndex={0}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pt-1 pb-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:mx-0 sm:gap-4 sm:px-0 [&>*]:shrink-0 [&>*]:snap-start"
        >
          {products.map((product) => (
            <div key={product.id} className={ITEM_WIDTH}>
              <ProductCard product={product} t={t} sizes={CARD_SIZES} className="h-full" />
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  )
}

export { NewArrivals }
