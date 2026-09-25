"use client"

import { OrderDetailSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { toast } from "sonner"
import { PackageX } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import type { OrderStatus as Status } from "@/lib/types/orders"
import { useOrder } from "@/lib/hooks/use-orders"
import { useProfiles } from "@/lib/hooks/use-admin-data"
import { updateOrderStatus } from "@/lib/services/orders"
import { ORDER_STATUSES } from "@/lib/order-status"
import { formatOrderDateTime } from "@/lib/date"
import { OrderStatus } from "@/components/order/order-status"
import { OrderItemsSection } from "@/components/order/order-items-section"
import { OrderDeliveryAddressSection } from "@/components/order/order-delivery-address-section"
import { OrderPaymentSection } from "@/components/order/order-payment-section"
import { OrderTimeline } from "@/components/order/order-timeline"
import { EmptyState } from "@/components/feedback/empty-state"
import { CommitSelect } from "@/components/forms/commit-select"
import { Button } from "@/components/ui/button"

// Reuses the exact Phase 9 presentational components the customer-facing
// /orders/[id] page already built — they're prop-driven with no ownership
// logic baked in, so nothing new is needed there. This page adds only what
// an admin needs that a customer's own view doesn't: a Customer identity
// block and a real status-change control. No ownership check (unlike the
// customer-facing OrderDetailContent) — the AdminShell layout gate is the
// only authorization this route needs.
function AdminOrderDetailContent({ orderId }: { orderId: string }) {
  const t = useT()
  const { data: order, loading: orderLoading, reload } = useOrder(orderId)
  const { data: profiles, loading: profilesLoading } = useProfiles()

  if (orderLoading || profilesLoading) return <OrderDetailSkeleton />

  if (!order) {
    return (
      <EmptyState
        titleAs="h1"
        icon={PackageX}
        title={t("order.notFound")}
        action={
          <Button asChild>
            <Link href="/admin/orders">{t("admin.orders.backToOrders")}</Link>
          </Button>
        }
      />
    )
  }

  const customer = profiles?.find((p) => p.id === order.user_id)
  const isTerminal = order.status === "delivered" || order.status === "cancelled"

  async function handleStatusChange(next: Status) {
    const result = await updateOrderStatus(orderId, next)
    if (!result.success) toast.error(result.error)
    reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-charcoal">{t("order.title", { number: order.order_number })}</h1>
          <p className="text-sm text-muted-text">
            {t("order.placed", { date: formatOrderDateTime(order.created_at, t.locale) })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatus status={order.status} />
          <CommitSelect
            value={order.status}
            disabled={isTerminal}
            onCommit={(next) => handleStatusChange(next as Status)}
            aria-label={t("admin.orders.changeStatusShort")}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-charcoal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`order.status.${status}`)}
              </option>
            ))}
          </CommitSelect>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <section className="space-y-2 rounded-card border border-border bg-card p-5 text-sm">
            <h2 className="font-medium text-charcoal">{t("admin.orders.customer")}</h2>
            <p className="text-charcoal">{customer?.fullName ?? t("admin.orders.deletedUser")}</p>
            {customer && (
              <>
                <p className="text-muted-text">{customer.email}</p>
                {customer.phone && <p className="text-muted-text">{customer.phone}</p>}
              </>
            )}
          </section>
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

export { AdminOrderDetailContent }
