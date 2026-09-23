import type { OrderRecord } from "@/lib/types/orders"
import type { AdminProfile } from "@/lib/services/admin-customers"
import type { Product } from "@/lib/data/products"

export interface DashboardStats {
  todaysSales: number
  monthlySales: number
  totalOrders: number
  totalCustomers: number
  lowStockProducts: Product[]
  recentOrders: OrderRecord[]
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

// Pure computation, centralized once — mirrors cart-math.ts's style so the
// dashboard's numbers and any future admin export/report can never drift
// out of sync with each other.
export function computeDashboardStats(
  orders: OrderRecord[],
  profiles: AdminProfile[],
  products: Product[]
): DashboardStats {
  const now = new Date()
  const nonCancelled = orders.filter((o) => o.status !== "cancelled")

  const todaysSales = nonCancelled
    .filter((o) => isSameDay(new Date(o.created_at), now))
    .reduce((sum, o) => sum + o.total, 0)

  const monthlySales = nonCancelled
    .filter((o) => isSameMonth(new Date(o.created_at), now))
    .reduce((sum, o) => sum + o.total, 0)

  const lowStockProducts = products
    .filter((p) => p.is_active && p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  return {
    todaysSales,
    monthlySales,
    totalOrders: orders.length,
    totalCustomers: profiles.filter((p) => p.role === "customer").length,
    lowStockProducts,
    recentOrders,
  }
}
