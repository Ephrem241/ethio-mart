import { MessageSquare } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { Rating } from "@/components/product/rating"
import { EmptyState } from "@/components/feedback/empty-state"

// The reviews table has zero seed data and no submission flow exists yet
// (would need auth, Phase 7) — an honest empty state, not fabricated reviews.
async function ProductReviewsSection({ product }: { product: ProductWithCategory }) {
  const t = await getT()

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h2 className="font-display text-xl font-semibold text-charcoal">{t("product.reviews.title")}</h2>
        {product.rating != null && <Rating value={product.rating} t={t} />}
      </div>
      <EmptyState
        icon={MessageSquare}
        title={t("product.reviews.empty")}
        description={t("product.reviews.emptyText")}
        className="py-10"
      />
    </section>
  )
}

export { ProductReviewsSection }
