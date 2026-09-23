"use client"

import { Users } from "lucide-react"

import { useAllOrders } from "@/lib/hooks/use-orders"
import { useProfiles } from "@/lib/hooks/use-admin-data"
import { computeCustomerRows } from "@/lib/admin/customer-rows"
import { formatOrderDate } from "@/lib/date"
import { formatPrice } from "@/lib/currency"
import { EmptyState } from "@/components/feedback/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

function AdminCustomersContent() {
  const { data: profiles, loading: profilesLoading } = useProfiles()
  const { data: orders, loading: ordersLoading } = useAllOrders()

  if (profilesLoading || ordersLoading) return null

  if (!profiles || !orders) {
    return <p className="text-sm text-error">We couldn&apos;t load your customers. Please refresh the page.</p>
  }

  const rows = computeCustomerRows(profiles, orders)

  if (rows.length === 0) {
    return <EmptyState icon={Users} title="No customers yet." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Total spent</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.fullName}</TableCell>
            <TableCell className="whitespace-nowrap">{row.email}</TableCell>
            <TableCell className="whitespace-nowrap">{row.phone ?? "—"}</TableCell>
            <TableCell>{row.orderCount}</TableCell>
            <TableCell className="whitespace-nowrap">{formatPrice(row.totalSpent)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatOrderDate(row.joinedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { AdminCustomersContent }
