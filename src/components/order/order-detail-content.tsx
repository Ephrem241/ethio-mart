"use client"

import { OrderDetailSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { ChevronLeft, PackageX } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useOrder } from "@/lib/hooks/use-orders"
import { formatOrderDateTime } from "@/lib/date"
import { OrderStatus } from "@/components/order/order-status"
import { OrderItemsSection } from "@/components/order/order-items-section"
import { OrderDeliveryAddressSection } from "@/components/order/order-delivery-address-section"
import { OrderPaymentSection } from "@/components/order/order-payment-section"
import { OrderTimeline } from "@/components/order/order-timeline"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

function OrderDetailContent({ orderId }: { orderId: string }) {
  const t = useT()
  const { user, ready } = useRequireAuth(`/login?redirect=/orders/${orderId}`)
  // Wait for the signed-in user before fetching; RLS then guarantees the
  // query can only ever return this user's own order.
  const { data: order, loading } = useOrder(user ? orderId : undefined)

  if (!ready || !user || loading) return <OrderDetailSkeleton />

  // A nonexistent order and one belonging to someone else render the
  // identical empty state — distinguishing them would let a signed-in user
  // enumerate other customers' order IDs by watching which UUIDs produce a
  // different message.
  const belongsToUser = order && order.user_id === user.id
  if (!order || !belongsToUser) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("order.notFound")}
        description={t("order.notFoundText")}
        action={
          <Button asChild>
            <Link href="/account/orders">{t("order.viewOrders")}</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-muted-text hover:text-charcoal">
          <ChevronLeft aria-hidden className="size-4" />
          {t("order.back")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-charcoal">{t("order.title", { number: order.order_number })}</h1>
            <p className="text-sm text-muted-text">
              {t("order.placed", { date: formatOrderDateTime(order.created_at, t.locale) })}
            </p>
          </div>
          <OrderStatus status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <OrderItemsSection items={order.items} />
          <OrderDeliveryAddressSection address={order.delivery_address} />
        </div>
        <div className="space-y-6">
          <OrderPaymentSection
            paymentMethod={order.payment_method}
            paymentStatus={order.payment_status}
            subtotal={order.subtotal}
            deliveryFee={order.delivery_fee}
            discount={order.discount}
            total={order.total}
          />
          <OrderTimeline history={order.status_history} />
        </div>
      </div>
    </div>
  )
}

export { OrderDetailContent }
