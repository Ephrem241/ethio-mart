"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Truck } from "lucide-react"

import { formatPrice } from "@/lib/currency"
import { useT } from "@/lib/i18n/provider"
import { getFreeDeliveryThreshold } from "@/lib/services/delivery"
import { Button } from "@/components/ui/button"

function OrderSummary({
  subtotal,
  totalSavings,
  canCheckout,
  deliveryFee,
  hideCta,
  bare,
}: {
  subtotal: number
  totalSavings: number
  canCheckout: boolean
  /** Drop the card frame and heading — for use inside another card (checkout). */
  bare?: boolean
  /** Once known (checkout only), folded into Total instead of the
   * "Calculated at checkout" placeholder. Savings stay purely informational
   * either way — subtotal already reflects post-discount prices, so they're
   * never subtracted a second time. */
  deliveryFee?: number
  /** Checkout supplies its own "Place order" submit button instead. */
  hideCta?: boolean
}) {
  const t = useT()
  const total = subtotal + (deliveryFee ?? 0)

  // The free-delivery offer, when the shop has one (store_settings). Read in
  // the browser like the fee itself; if it can't be loaded the hint is simply
  // not shown — checkout prices the order regardless.
  const [threshold, setThreshold] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    getFreeDeliveryThreshold()
      .then((value) => {
        if (!cancelled) setThreshold(value)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  const unlocked = threshold != null && subtotal > threshold

  return (
    <div className={bare ? "space-y-4" : "space-y-4 rounded-card border border-border/70 bg-card p-5 shadow-soft sm:p-6"}>
      {!bare && <h2 className="font-display text-lg font-semibold text-charcoal">{t("cart.summary.title")}</h2>}

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-text">{t("cart.summary.subtotal")}</span>
          <span className="text-charcoal">{formatPrice(subtotal, t)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-text">{t("cart.summary.saving")}</span>
            <span className="text-success">-{formatPrice(totalSavings, t)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-text">{t("cart.summary.delivery")}</span>
          <span
            className={
              deliveryFee === 0 ? "font-medium text-success" : deliveryFee != null ? "text-charcoal" : "text-muted-text"
            }
          >
            {deliveryFee === 0
              ? t("cart.summary.free")
              : deliveryFee != null
                ? formatPrice(deliveryFee, t)
                : t("cart.summary.calculatedAtCheckout")}
          </span>
        </div>
      </div>

      {threshold != null && deliveryFee == null && (
        <p
          className={
            unlocked
              ? "flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm text-success"
              : "flex items-start gap-2 rounded-xl bg-cream px-3 py-2.5 text-sm text-charcoal/80"
          }
        >
          <Truck aria-hidden className="mt-0.5 size-4 shrink-0" />
          {unlocked
            ? t("cart.summary.freeDeliveryUnlocked")
            : t("cart.summary.freeDeliveryOffer", { amount: formatPrice(threshold, t) })}
        </p>
      )}

      <div className="border-t border-border pt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-medium text-charcoal">{t("cart.summary.total")}</span>
          <span className="text-xl font-semibold text-forest">{formatPrice(total, t)}</span>
        </div>
        {deliveryFee == null && (
          <p className="mt-1 text-xs text-muted-text">{t("cart.summary.deliveryAdded")}</p>
        )}
      </div>

      {hideCta ? null : canCheckout ? (
        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">{t("cart.summary.continue")}</Link>
        </Button>
      ) : (
        // A disabled <a> isn't actually inert (the `disabled` attribute/CSS
        // pseudo-class don't apply to anchors), so a real, non-navigating
        // <button disabled> is used here instead of a Link-wrapped one.
        <Button size="lg" className="w-full" disabled>
          {t("cart.summary.continue")}
        </Button>
      )}
    </div>
  )
}

export { OrderSummary }
