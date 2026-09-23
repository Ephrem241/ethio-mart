"use client"

import { useEffect, useState } from "react"
import { useFormContext } from "react-hook-form"
import { AlertTriangle } from "lucide-react"

import { useCartStore } from "@/lib/store/cart"
import { useProductsByIds } from "@/lib/hooks/use-products-by-ids"
import {
  resolveCartLines,
  computeCartTotals,
  getInsufficientStockLines,
  type ResolvedCartLine,
} from "@/lib/cart-math"
import type { CartLine } from "@/lib/store/cart"
import { getDeliveryFee } from "@/lib/services/delivery"
import { CheckoutOrderItem } from "@/components/checkout/checkout-order-item"
import { OrderSummary } from "@/components/cart/order-summary"
import { Button } from "@/components/ui/button"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

function CheckoutReviewSection({
  submitError,
  isSubmitting,
}: {
  submitError?: string
  isSubmitting: boolean
}) {
  const { watch } = useFormContext<CheckoutValues>()
  const city = watch("city")
  const items = useCartStore((s) => s.items)
  const [deliveryFee, setDeliveryFee] = useState<number | undefined>(undefined)

  const { products, loading } = useProductsByIds(items.map((i) => i.productId))

  // Until the live product data has come back nothing can be validated, so
  // don't show a spurious "no longer available" warning — and don't let the
  // order be submitted either (hasBlockingIssue below).
  const { resolvedLines, unavailableLines }: {
    resolvedLines: ResolvedCartLine[]
    unavailableLines: CartLine[]
  } = loading ? { resolvedLines: [], unavailableLines: [] } : resolveCartLines(items, products)
  const { subtotal, savings } = computeCartTotals(resolvedLines)
  const insufficientStock = getInsufficientStockLines(resolvedLines)

  // Live estimate as the user picks a city (delivery fees are still a local
  // table — no admin UI for them was ever built; see services/delivery.ts).
  useEffect(() => {
    let cancelled = false
    getDeliveryFee(city ?? "").then((fee) => {
      if (!cancelled) setDeliveryFee(city ? fee : undefined)
    })
    return () => {
      cancelled = true
    }
  }, [city])

  const hasBlockingIssue =
    loading ||
    resolvedLines.length === 0 ||
    unavailableLines.length > 0 ||
    insufficientStock.length > 0

  return (
    <section className="space-y-4 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">Order review</h2>

      <div>
        {resolvedLines.map(({ line, product }) => (
          <CheckoutOrderItem key={product.id} line={line} product={product} />
        ))}
      </div>

      {insufficientStock.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          Not enough stock for {insufficientStock.map(({ product }) => product.name_en).join(", ")}
          . Update your cart to continue.
        </p>
      )}
      {unavailableLines.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          Some items in your cart are no longer available. Remove them from your cart to continue.
        </p>
      )}

      <OrderSummary subtotal={subtotal} totalSavings={savings} canCheckout hideCta deliveryFee={deliveryFee} />

      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting || hasBlockingIssue}>
        {isSubmitting ? "Placing order..." : "Place order"}
      </Button>
    </section>
  )
}

export { CheckoutReviewSection }
