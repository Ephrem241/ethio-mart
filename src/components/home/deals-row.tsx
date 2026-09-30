import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductCard } from "@/components/product/product-card"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/home/section-heading"
import { CarouselControls } from "@/components/home/carousel-controls"

// The homepage's Special Deals section: a sideways-scrolling row of the
// products actually on sale right now, same rail idiom as New Arrivals. The
// promotion's countdown lives in the deal popup (deal-popup.tsx) rather than
// in a big banner here.
const ITEM_WIDTH = "w-[44%] sm:w-[30%] lg:w-[23%] xl:w-[18.5%]"
const CARD_SIZES = "(min-width: 1280px) 220px, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 44vw"
const RAIL_ID = "deals-rail"

async function DealsRow({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null
  const t = await getT()

  return (
    <Reveal>
      <section aria-labelledby="deals-row-heading" className="space-y-6">
        <SectionHeading
          id="deals-row-heading"
          title={t("home.flashTitle")}
          href="/shop?sale=1"
          linkLabel={t("home.viewAll")}
          // Arrows on desktop only: phones and tablets keep the row as it was.
          actions={
            <div className="hidden lg:contents">
              <CarouselControls targetId={RAIL_ID} />
            </div>
          }
        />
        {/* A scrollable region: focusable so the keyboard can scroll it. */}
        <div
          id={RAIL_ID}
          role="region"
          aria-label={t("home.carousel.rail", { title: t("home.flashTitle") })}
          tabIndex={0}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pt-1 pb-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:mx-0 lg:gap-4 lg:px-0 [&>*]:shrink-0 [&>*]:snap-start"
        >
          {products.map((product) => (
            <div key={product.id} className={ITEM_WIDTH}>
              <ProductCard product={product} t={t} badge={t("home.flashBadge")} sizes={CARD_SIZES} className="h-full" />
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  )
}

export { DealsRow }
