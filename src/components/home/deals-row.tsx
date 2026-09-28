import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { ProductCard } from "@/components/product/product-card"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/home/section-heading"

// A sideways-scrolling row of the products actually on sale right now — a
// phone-only complement to New Arrivals, same rail idiom. Desktop already has
// its own Special Deals banner and doesn't get a second products row for the
// same discounts, so this whole section is `lg:hidden`.
const ITEM_WIDTH = "w-[44%] sm:w-[30%]"
const CARD_SIZES = "(min-width: 640px) 30vw, 44vw"

async function DealsRow({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null
  const t = await getT()

  return (
    <Reveal className="lg:hidden">
      <section aria-labelledby="deals-row-heading" className="space-y-6">
        <SectionHeading
          id="deals-row-heading"
          title={t("home.flashTitle")}
          href="/shop?sale=1"
          linkLabel={t("home.viewAll")}
        />
        {/* A scrollable region: focusable so the keyboard can scroll it. */}
        <div
          role="region"
          aria-label={t("home.carousel.rail", { title: t("home.flashTitle") })}
          tabIndex={0}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pt-1 pb-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&>*]:shrink-0 [&>*]:snap-start"
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
