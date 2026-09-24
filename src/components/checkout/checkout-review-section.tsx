"use client"

import { useEffect, useState } from "react"
import { useFormContext } from "react-hook-form"
import { AlertTriangle } from "lucide-react"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
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
import { CheckoutStep } from "@/components/checkout/checkout-step"
import { Button } from "@/components/ui/button"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

function CheckoutReviewSection({
  submitError,
  isSubmitting,
}: {
  submitError?: string
  isSubmitting: boolean
}) {
  const t = useT()
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

  // Live estimate as the user picks a city (fees come from the delivery_fees
  // table, and the free-delivery rule from store_settings — see
  // services/delivery.ts). The database re-prices the order itself.
  useEffect(() => {
    let cancelled = false
    getDeliveryFee(city ?? "", subtotal).then((fee) => {
      if (!cancelled) setDeliveryFee(city ? fee : undefined)
    })
    return () => {
      cancelled = true
    }
  }, [city, subtotal])

  const hasBlockingIssue =
    loading ||
    resolvedLines.length === 0 ||
    unavailableLines.length > 0 ||
    insufficientStock.length > 0

  return (
    <CheckoutStep number={3} title={t("checkout.review.title")}>
      <div>
        {resolvedLines.map(({ line, product }) => (
          <CheckoutOrderItem key={product.id} line={line} product={product} />
        ))}
      </div>

      {insufficientStock.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("checkout.review.insufficientStock", {
            names: insufficientStock.map(({ product }) => nameOf(product, t.locale)).join(", "),
          })}
        </p>
      )}
      {unavailableLines.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("checkout.review.unavailable")}
        </p>
      )}

      <OrderSummary subtotal={subtotal} totalSavings={savings} canCheckout hideCta bare deliveryFee={deliveryFee} />

      {submitError && (
        <p role="alert" className="text-sm text-error">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || hasBlockingIssue}>
        {isSubmitting ? t("checkout.review.placing") : t("checkout.review.place")}
      </Button>
    </CheckoutStep>
  )
}

export { CheckoutReviewSection }
