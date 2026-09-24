"use client"

import { CardListSkeleton } from "@/components/feedback/skeletons"
import { useState } from "react"
import Link from "next/link"
import { PackageX, SearchX } from "lucide-react"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useMyOrders } from "@/lib/hooks/use-orders"
import { useProductsByIds } from "@/lib/hooks/use-products-by-ids"
import { ORDER_HISTORY_FILTERS, matchesOrderHistoryFilter, type OrderHistoryFilter } from "@/lib/order-status"
import { formatOrderDate } from "@/lib/date"
import { formatPrice } from "@/lib/currency"
import { OrderStatus } from "@/components/order/order-status"
import { EmptyState } from "@/components/feedback/empty-state"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

function AccountOrdersContent() {
  const t = useT()
  const { user, ready } = useRequireAuth("/login?redirect=/account/orders")
  const { data: orders, loading, error } = useMyOrders(user?.id)
  // Order lines keep the English name they were bought under; while the
  // product still exists, show its name in the visitor's language instead.
  const { products } = useProductsByIds(
    (orders ?? []).flatMap((o) => o.items.map((i) => i.product_id).filter((id): id is string => id !== null))
  )
  const productsById = new Map(products.map((p) => [p.id, p]))

  function lineName(item: { product_id: string | null; product_name: string }): string {
    const product = item.product_id ? productsById.get(item.product_id) : undefined
    return product ? nameOf(product, t.locale) : item.product_name
  }

  function itemsSummary(items: { product_id: string | null; product_name: string; quantity: number }[]): string {
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
    if (items.length === 1) {
      return t("account.orders.summaryOne", { name: lineName(items[0]), quantity: items[0].quantity })
    }
    return t("account.orders.summaryMore", {
      name: lineName(items[0]),
      more: items.length - 1,
      total: totalQty,
    })
  }
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderHistoryFilter>("all")

  if (!ready || !user || loading) return <CardListSkeleton />

  if (error || !orders) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("account.orders.loadFailed")}
        description={t("account.orders.refresh")}
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
        title={t("account.orders.emptyTitle")}
        description={t("account.orders.emptyText")}
        action={
          <Button asChild>
            <Link href="/shop">{t("account.orders.startShopping")}</Link>
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
          placeholder={t("account.orders.searchPlaceholder")}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {ORDER_HISTORY_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              aria-pressed={statusFilter === f}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                statusFilter === f
                  ? "border-forest bg-forest text-white"
                  : "border-border text-charcoal hover:bg-sand/30"
              )}
            >
              {t(`order.historyFilter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("account.orders.noMatch")}
          description={t("account.orders.noMatchText")}
          action={
            <Button variant="outline" onClick={clearFilters}>
              {t("account.orders.clearFilters")}
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
                <p className="font-medium text-charcoal">{t("account.orders.orderNumber", { number: order.order_number })}</p>
                <p className="text-sm text-muted-text">{formatOrderDate(order.created_at, t.locale)}</p>
                <p className="text-sm text-muted-text">{itemsSummary(order.items)}</p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                <span className="font-medium text-charcoal">{formatPrice(order.total, t)}</span>
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
