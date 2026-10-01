import { describe, expect, it } from "vitest"

import { computeCustomerRows } from "@/lib/admin/customer-rows"
import type { AdminProfile } from "@/lib/services/admin-customers"
import type { OrderRecord } from "@/lib/types/orders"

const profile = (id: string, role: AdminProfile["role"]): AdminProfile => ({
  id,
  fullName: `User ${id}`,
  email: `${id}@mail.et`,
  role,
  createdAt: "2026-09-30T10:00:00Z",
})

const order = (user_id: string, total: number, status: OrderRecord["status"] = "delivered") =>
  ({ id: `${user_id}-${total}`, user_id, total, status }) as OrderRecord

describe("customer rows", () => {
  it("lists every account with its role, admins too, so admin access can be managed", () => {
    const rows = computeCustomerRows([profile("a", "customer"), profile("b", "admin")], [])
    expect(rows.map((r) => [r.id, r.role])).toEqual([
      ["a", "customer"],
      ["b", "admin"],
    ])
  })

  it("counts each person's orders, and leaves cancelled ones out of what they spent", () => {
    const [row] = computeCustomerRows([profile("a", "customer")], [order("a", 500), order("a", 300, "cancelled"), order("x", 900)])
    expect(row.orderCount).toBe(2)
    expect(row.totalSpent).toBe(500)
  })
})
