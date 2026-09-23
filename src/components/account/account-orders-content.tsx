"use client"

import { useState } from "react"
import Link from "next/link"
import { PackageX, SearchX } from "lucide-react"

import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useMyOrders } from "@/lib/hooks/use-orders"
import { ORDER_HISTORY_FILTERS, matchesOrderHistoryFilter, type OrderHistoryFilter } from "@/lib/order-status"
import { formatOrderDate } from "@/lib/date"
import { formatPrice } from "@/lib/currency"
import { OrderStatus } from "@/components/order/order-status"
import { EmptyState } from "@/components/feedback/empty-state"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

function itemsSummary(items: { product_name: string; quantity: number }[]): string {
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
  if (items.length === 1) return `${items[0].product_name} × ${items[0].quantity}`
  return `${items[0].product_name} + ${items.length - 1} more (${totalQty} items)`
}

function AccountOrdersContent() {
  const { user, ready } = useRequireAuth("/login?redirect=/account/orders")
  const { data: orders, loading, error } = useMyOrders(user?.id)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderHistoryFilter>("all")

  if (!ready || !user || loading) return null

  if (error || !orders) {
    return (
      <EmptyState
        icon={PackageX}
        title="We couldn't load your orders."
        description="Please refresh the page and try again."
      />
    )
  }

  const filtered = orders
    .filter((o) => matchesOrderHistoryFilter(o.status, statusFilter))
    .filter((o) => !search.trim() || o.order_number.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  function clearFilters() {
    setSearch("")
    setStatusFilter("all")
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={PackageX}
        title="No orders yet."
        description="When you place an order, it will show up here."
        action={
          <Button asChild>
            <Link href="/shop">Start shopping</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {ORDER_HISTORY_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              aria-pressed={statusFilter === f.id}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                statusFilter === f.id
                  ? "border-burgundy bg-burgundy text-white"
                  : "border-border text-charcoal hover:bg-sand/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No orders match your search."
          description="Try a different order number or filter."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex flex-col gap-2 rounded-card border border-border bg-card p-4 transition-colors hover:bg-sand/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-charcoal">Order #{order.order_number}</p>
                <p className="text-sm text-muted-text">{formatOrderDate(order.created_at)}</p>
                <p className="text-sm text-muted-text">{itemsSummary(order.items)}</p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                <span className="font-medium text-charcoal">{formatPrice(order.total)}</span>
                <OrderStatus status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export { AccountOrdersContent }
