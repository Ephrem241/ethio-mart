"use client"

import Link from "next/link"
import { toast } from "sonner"
import { ShoppingCart } from "lucide-react"

import type { OrderStatus as Status } from "@/lib/types/orders"
import { useAllOrders } from "@/lib/hooks/use-orders"
import { useProfiles } from "@/lib/hooks/use-admin-data"
import { updateOrderStatus } from "@/lib/services/orders"
import { getPaymentProvider } from "@/lib/services/payment"
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status"
import { formatOrderDate } from "@/lib/date"
import { formatPrice } from "@/lib/currency"
import { OrderStatus } from "@/components/order/order-status"
import { EmptyState } from "@/components/feedback/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

function AdminOrdersContent() {
  const { data: orders, loading: ordersLoading, reload } = useAllOrders()
  const { data: profiles, loading: profilesLoading } = useProfiles()

  if (ordersLoading || profilesLoading) return null

  if (!orders || !profiles) {
    return <p className="text-sm text-error">We couldn&apos;t load orders. Please refresh the page.</p>
  }

  if (orders.length === 0) {
    return <EmptyState icon={ShoppingCart} title="No orders yet." />
  }

  const sorted = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  async function handleStatusChange(orderId: string, next: Status) {
    const result = await updateOrderStatus(orderId, next)
    if (!result.success) toast.error(result.error)
    // Reload either way: on a refused change the dropdown must snap back to
    // the order's real status.
    reload()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((order) => {
          const customer = profiles.find((p) => p.id === order.user_id)
          const isTerminal = order.status === "delivered" || order.status === "cancelled"
          return (
            <TableRow key={order.id}>
              <TableCell className="whitespace-nowrap font-medium">{order.order_number}</TableCell>
              <TableCell className="whitespace-nowrap">{customer?.fullName ?? "Deleted user"}</TableCell>
              <TableCell className="whitespace-nowrap">{formatOrderDate(order.created_at)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatPrice(order.total)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {getPaymentProvider(order.payment_method)?.label ?? order.payment_method}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <OrderStatus status={order.status} />
                  <select
                    value={order.status}
                    disabled={isTerminal}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Status)}
                    aria-label={`Change status for order ${order.order_number}`}
                    className="h-7 rounded-lg border border-input bg-transparent px-1.5 text-xs text-charcoal outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/admin/orders/${order.id}`} className="text-sm text-burgundy hover:underline">
                  View
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export { AdminOrdersContent }
