import type { AdminProfile } from "@/lib/services/admin-customers"
import type { Role } from "@/lib/store/auth"
import type { OrderRecord } from "@/lib/types/orders"

export interface CustomerRow {
  id: string
  fullName: string
  email: string
  phone?: string
  role: Role
  orderCount: number
  totalSpent: number
  joinedAt: string
}

// Pure, mirrors cart-math.ts's style. Rows carry only what the customers
// screen shows (spec Section 32: "do not expose sensitive information
// unnecessarily"); credentials are not in `profiles` at all. Every account
// is listed, admins too, so an admin can give or take away admin access.
export function computeCustomerRows(profiles: AdminProfile[], orders: OrderRecord[]): CustomerRow[] {
  return profiles
    .map((p) => {
      const userOrders = orders.filter((o) => o.user_id === p.id)
      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        role: p.role,
        orderCount: userOrders.length,
        // A cancelled order is money never spent (same rule as the dashboard).
        totalSpent: userOrders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0),
        joinedAt: p.createdAt,
      }
    })
}
