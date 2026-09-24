"use client"

import { CardListSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { CheckCircle2, PackageX } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useOrder } from "@/lib/hooks/use-orders"
import { getPaymentProvider } from "@/lib/services/payment"
import { cityLabel } from "@/lib/services/delivery"
import { formatPrice } from "@/lib/currency"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

function OrderSuccessContent({ orderId }: { orderId: string }) {
  const t = useT()
  const { user, ready } = useRequireAuth(`/login?redirect=/order/success/${orderId}`)
  const { data: order, loading } = useOrder(user ? orderId : undefined)

  // Render nothing until the order has actually been looked up — otherwise
  // a real order would briefly show as "not found" before it arrives.
  if (!ready || !user || loading) return <CardListSkeleton rows={1} />

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("order.notFound")}
        description={t("order.notFoundShort")}
        action={
          <Button asChild>
            <Link href="/shop">{t("order.success.continue")}</Link>
          </Button>
        }
      />
    )
  }

  const provider = getPaymentProvider(order.payment_method)
  const address = order.delivery_address

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-card border border-border bg-card p-6 text-center">
      <CheckCircle2 aria-hidden className="mx-auto size-14 text-success" />
      <div>
        <h1 className="text-xl font-semibold text-charcoal">{t("order.success.title")}</h1>
        <p className="text-muted-text">{t("order.title", { number: order.order_number })}</p>
      </div>

      <div className="space-y-3 rounded-lg bg-sand/30 p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-text">{t("cart.summary.total")}</span>
          <span className="font-medium text-charcoal">{formatPrice(order.total, t)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-text">{t("checkout.payment.title")}</span>
          <span className="text-charcoal">{provider ? t(provider.label) : order.payment_method}</span>
        </div>
        <div>
          <p className="text-muted-text">{t("order.address.title")}</p>
          <p className="text-charcoal">
            {address.full_name}, {address.phone}
            <br />
            {address.address}, {address.woreda}, {address.sub_city}, {cityLabel(address.city, t)}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-text">{t("order.success.eta")}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/orders/${order.id}`}>{t("order.success.track")}</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/shop">{t("order.success.continue")}</Link>
        </Button>
      </div>
    </div>
  )
}

export { OrderSuccessContent }
