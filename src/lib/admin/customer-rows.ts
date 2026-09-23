import type { AdminProfile } from "@/lib/services/admin-customers"
import type { OrderRecord } from "@/lib/types/orders"

export interface CustomerRow {
  id: string
  fullName: string
  email: string
  phone?: string
  orderCount: number
  totalSpent: number
  joinedAt: string
}

// Pure, mirrors cart-math.ts's style. Rows carry only what the customers
// screen shows (spec Section 32: "do not expose sensitive information
// unnecessarily"); credentials are not in `profiles` at all.
export function computeCustomerRows(profiles: AdminProfile[], orders: OrderRecord[]): CustomerRow[] {
  return profiles
    .filter((u) => u.role === "customer")
    .map((p) => {
      const userOrders = orders.filter((o) => o.user_id === p.id)
      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        orderCount: userOrders.length,
        totalSpent: userOrders.reduce((sum, o) => sum + o.total, 0),
        joinedAt: p.createdAt,
      }
    })
}
