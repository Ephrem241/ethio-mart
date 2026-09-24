"use client"

import { useT } from "@/lib/i18n/provider"
import type { PaymentMethodId } from "@/lib/types/orders"
import type { PaymentStatus } from "@/lib/services/payment"
import { getPaymentProvider } from "@/lib/services/payment"
import { formatPrice } from "@/lib/currency"

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
  const t = useT()
  const provider = getPaymentProvider(paymentMethod)

  return (
    <section className="space-y-3 rounded-card border border-border bg-card p-5 text-sm">
      <h2 className="font-medium text-charcoal">{t("order.payment.title")}</h2>
      <div className="flex justify-between">
        <span className="text-muted-text">{t("order.payment.method")}</span>
        <span className="text-charcoal">{provider ? t(provider.label) : paymentMethod}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-text">{t("order.payment.status")}</span>
        <span className="text-charcoal">{t(`order.paymentStatus.${paymentStatus}`)}</span>
      </div>
      <div className="space-y-1 border-t border-border pt-3">
        <div className="flex justify-between">
          <span className="text-muted-text">{t("order.payment.subtotal")}</span>
          <span className="text-charcoal">{formatPrice(subtotal, t)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-text">{t("order.payment.discount")}</span>
            <span className="text-charcoal">-{formatPrice(discount, t)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-text">{t("order.payment.delivery")}</span>
          <span className="text-charcoal">{formatPrice(deliveryFee, t)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-charcoal">{t("order.payment.total")}</span>
          <span className="text-charcoal">{formatPrice(total, t)}</span>
        </div>
      </div>
    </section>
  )
}

export { OrderPaymentSection }
