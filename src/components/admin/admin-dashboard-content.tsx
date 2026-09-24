"use client"

import { DashboardSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
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
  const t = useT()
  const { data: orders, loading: ordersLoading } = useAllOrders()
  const { data: profiles, loading: profilesLoading } = useProfiles()
  const { data: products, loading: productsLoading } = useAdminProducts()

  if (ordersLoading || profilesLoading || productsLoading) return <DashboardSkeleton />

  if (!orders || !profiles || !products) {
    return <p className="text-sm text-error">{t("admin.loadFailed.dashboard")}</p>
  }

  const stats = computeDashboardStats(orders, profiles, products)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("admin.dashboard.todaysSales")} value={formatPrice(stats.todaysSales, t)} />
        <StatCard label={t("admin.dashboard.monthlySales")} value={formatPrice(stats.monthlySales, t)} />
        <StatCard label={t("admin.dashboard.totalOrders")} value={String(stats.totalOrders)} />
        <StatCard label={t("admin.dashboard.totalCustomers")} value={String(stats.totalCustomers)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-card border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-charcoal">{t("admin.dashboard.lowStock")}</h2>
            <Link href="/admin/products" className="text-sm text-forest hover:underline">
              {t("admin.dashboard.manageProducts")}
            </Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-text">{t("admin.dashboard.noLowStock")}</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">{nameOf(p, t.locale)}</span>
                  <span className="text-warning">{t("admin.dashboard.left", { count: p.stock })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-card border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-charcoal">{t("admin.dashboard.recentOrders")}</h2>
            <Link href="/admin/orders" className="text-sm text-forest hover:underline">
              {t("admin.dashboard.viewAllOrders")}
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-text">{t("admin.dashboard.noOrders")}</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between text-sm hover:text-forest"
                  >
                    <span className="text-charcoal">
                      #{o.order_number} · {formatOrderDate(o.created_at, t.locale)}
                    </span>
                    <span className="flex items-center gap-2">
                      {formatPrice(o.total, t)}
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
