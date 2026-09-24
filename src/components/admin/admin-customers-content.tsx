"use client"

import { TableSkeleton } from "@/components/feedback/skeletons"
import { Users } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { useAllOrders } from "@/lib/hooks/use-orders"
import { useProfiles } from "@/lib/hooks/use-admin-data"
import { computeCustomerRows } from "@/lib/admin/customer-rows"
import { formatOrderDate } from "@/lib/date"
import { formatPrice } from "@/lib/currency"
import { EmptyState } from "@/components/feedback/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

function AdminCustomersContent() {
  const t = useT()
  const { data: profiles, loading: profilesLoading } = useProfiles()
  const { data: orders, loading: ordersLoading } = useAllOrders()

  if (profilesLoading || ordersLoading) return <TableSkeleton columns={6} />

  if (!profiles || !orders) {
    return <p className="text-sm text-error">{t("admin.loadFailed.customers")}</p>
  }

  const rows = computeCustomerRows(profiles, orders)

  if (rows.length === 0) {
    return <EmptyState icon={Users} title={t("admin.customers.empty")} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("admin.customers.columns.customer")}</TableHead>
          <TableHead>{t("admin.customers.columns.email")}</TableHead>
          <TableHead>{t("admin.customers.columns.phone")}</TableHead>
          <TableHead>{t("admin.customers.columns.orders")}</TableHead>
          <TableHead>{t("admin.customers.columns.totalSpent")}</TableHead>
          <TableHead>{t("admin.customers.columns.joined")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.fullName}</TableCell>
            <TableCell className="whitespace-nowrap">{row.email}</TableCell>
            <TableCell className="whitespace-nowrap">{row.phone ?? "—"}</TableCell>
            <TableCell>{row.orderCount}</TableCell>
            <TableCell className="whitespace-nowrap">{formatPrice(row.totalSpent, t)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatOrderDate(row.joinedAt, t.locale)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { AdminCustomersContent }
