"use client"

import Link from "next/link"

import { useAllOrders } from "@/lib/hooks/use-orders"
import { useAdminProducts, useProfiles } from "@/lib/hooks/use-admin-data"
import { computeDashboardStats } from "@/lib/admin/dashboard-stats"
import { formatPrice } from "@/lib/currency"
import { formatOrderDate } from "@/lib/date"
import { OrderStatus } from "@/components/order/order-status"

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="text-sm text-muted-text">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-charcoal">{value}</p>
    </div>
  )
}

function AdminDashboardContent() {
  const { data: orders, loading: ordersLoading } = useAllOrders()
  const { data: profiles, loading: profilesLoading } = useProfiles()
  const { data: products, loading: productsLoading } = useAdminProducts()

  if (ordersLoading || profilesLoading || productsLoading) return null

  if (!orders || !profiles || !products) {
    return <p className="text-sm text-error">We couldn&apos;t load the dashboard. Please refresh the page.</p>
  }

  const stats = computeDashboardStats(orders, profiles, products)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's sales" value={formatPrice(stats.todaysSales)} />
        <StatCard label="Monthly sales" value={formatPrice(stats.monthlySales)} />
        <StatCard label="Total orders" value={String(stats.totalOrders)} />
        <StatCard label="Total customers" value={String(stats.totalCustomers)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-card border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-charcoal">Low stock</h2>
            <Link href="/admin/products" className="text-sm text-burgundy hover:underline">
              Manage products
            </Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-text">No products are low on stock.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">{p.name_en}</span>
                  <span className="text-warning">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-card border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-charcoal">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-burgundy hover:underline">
              View all orders
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-text">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between text-sm hover:text-burgundy"
                  >
                    <span className="text-charcoal">
                      #{o.order_number} · {formatOrderDate(o.created_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      {formatPrice(o.total)}
                      <OrderStatus status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export { AdminDashboardContent }
