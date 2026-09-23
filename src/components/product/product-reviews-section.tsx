import { MessageSquare } from "lucide-react"

import type { ProductWithCategory } from "@/lib/services/catalog"
import { Rating } from "@/components/product/rating"
import { EmptyState } from "@/components/feedback/empty-state"

// The reviews table has zero seed data and no submission flow exists yet
// (would need auth, Phase 7) — an honest empty state, not fabricated reviews.
function ProductReviewsSection({ product }: { product: ProductWithCategory }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-medium text-charcoal">Reviews</h2>
        {product.rating != null && <Rating value={product.rating} />}
      </div>
      <EmptyState
        icon={MessageSquare}
        title="No reviews yet."
        description="This product doesn't have any customer reviews yet."
      />
    </section>
  )
}

export { ProductReviewsSection }
