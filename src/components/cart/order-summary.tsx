import Link from "next/link"

import { formatPrice } from "@/lib/currency"
import { Button } from "@/components/ui/button"

function OrderSummary({
  subtotal,
  totalSavings,
  canCheckout,
  deliveryFee,
  hideCta,
}: {
  subtotal: number
  totalSavings: number
  canCheckout: boolean
  /** Once known (checkout only), folded into Total instead of the
   * "Calculated at checkout" placeholder. Savings stay purely informational
   * either way — subtotal already reflects post-discount prices, so they're
   * never subtracted a second time. */
  deliveryFee?: number
  /** Checkout supplies its own "Place order" submit button instead. */
  hideCta?: boolean
}) {
  const total = subtotal + (deliveryFee ?? 0)

  return (
    <div className="space-y-4 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">Order summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-text">Subtotal</span>
          <span className="text-charcoal">{formatPrice(subtotal)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-text">You&apos;re saving</span>
            <span className="text-success">-{formatPrice(totalSavings)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-text">Delivery</span>
          <span className={deliveryFee != null ? "text-charcoal" : "text-muted-text"}>
            {deliveryFee != null ? formatPrice(deliveryFee) : "Calculated at checkout"}
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex justify-between font-medium">
          <span className="text-charcoal">Total</span>
          <span className="text-burgundy">{formatPrice(total)}</span>
        </div>
        {deliveryFee == null && (
          <p className="mt-1 text-xs text-muted-text">Delivery is added at checkout.</p>
        )}
      </div>

      {hideCta ? null : canCheckout ? (
        <Button asChild className="w-full">
          <Link href="/checkout">Continue to checkout</Link>
        </Button>
      ) : (
        // A disabled <a> isn't actually inert (the `disabled` attribute/CSS
        // pseudo-class don't apply to anchors), so a real, non-navigating
        // <button disabled> is used here instead of a Link-wrapped one.
        <Button className="w-full" disabled>
          Continue to checkout
        </Button>
      )}
    </div>
  )
}

export { OrderSummary }
