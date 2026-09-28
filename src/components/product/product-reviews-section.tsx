import { MessageSquare } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { Rating } from "@/components/product/rating"
import { EmptyState } from "@/components/feedback/empty-state"
import { MobileCollapsible } from "@/components/ui/mobile-collapsible"

// The reviews table has zero seed data and no submission flow exists yet
// (would need auth, Phase 7) — an honest empty state, not fabricated reviews.
//
// Below `lg` it is a card that folds away, the rating shown in its toggle; the
// empty state inside loses its own card there, so there is no box in a box.
// (`max-lg:py-4!` must be important: EmptyState's own `sm:py-16` comes later
// in the stylesheet than `max-lg:` rules and would win on tablets.)
async function ProductReviewsSection({ product }: { product: ProductWithCategory }) {
  const t = await getT()
  const rating = product.rating != null ? <Rating value={product.rating} t={t} /> : null

  return (
    <section className="space-y-4 max-lg:space-y-0 max-lg:rounded-card max-lg:border max-lg:border-border/70 max-lg:bg-card max-lg:shadow-soft">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 max-lg:hidden">
        <h2 className="font-display text-xl font-semibold text-charcoal">{t("product.reviews.title")}</h2>
        {rating}
      </div>
      <MobileCollapsible
        id="product-reviews"
        label={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {t("product.reviews.title")}
            {rating}
          </span>
        }
        icon={<MessageSquare aria-hidden className="size-5 text-forest" strokeWidth={1.75} />}
        className="max-lg:px-5 max-lg:pb-5"
      >
        <EmptyState
          icon={MessageSquare}
          title={t("product.reviews.empty")}
          description={t("product.reviews.emptyText")}
          className="py-10 max-lg:border-0 max-lg:bg-transparent max-lg:px-0 max-lg:py-4! max-lg:shadow-none"
        />
      </MobileCollapsible>
    </section>
  )
}

export { ProductReviewsSection }
