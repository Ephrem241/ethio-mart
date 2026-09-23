import type { PaymentMethodId } from "@/lib/types/orders"
import type { PaymentStatus } from "@/lib/services/payment"
import { getPaymentProvider } from "@/lib/services/payment"
import { formatPrice } from "@/lib/currency"

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
}

function OrderPaymentSection({
  paymentMethod,
  paymentStatus,
  subtotal,
  deliveryFee,
  discount,
  total,
}: {
  paymentMethod: PaymentMethodId
  paymentStatus: PaymentStatus
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
}) {
  const provider = getPaymentProvider(paymentMethod)

  return (
    <section className="space-y-3 rounded-card border border-border bg-card p-5 text-sm">
      <h2 className="font-medium text-charcoal">Payment</h2>
      <div className="flex justify-between">
        <span className="text-muted-text">Method</span>
        <span className="text-charcoal">{provider?.label ?? paymentMethod}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-text">Payment status</span>
        <span className="text-charcoal">{PAYMENT_STATUS_LABELS[paymentStatus]}</span>
      </div>
      <div className="space-y-1 border-t border-border pt-3">
        <div className="flex justify-between">
          <span className="text-muted-text">Subtotal</span>
          <span className="text-charcoal">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-text">Discount</span>
            <span className="text-charcoal">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-text">Delivery</span>
          <span className="text-charcoal">{formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-charcoal">Total</span>
          <span className="text-charcoal">{formatPrice(total)}</span>
        </div>
      </div>
    </section>
  )
}

export { OrderPaymentSection }
