"use client"

import { TableSkeleton } from "@/components/feedback/skeletons"
import { useState } from "react"
import { toast } from "sonner"
import { Users } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { useAllOrders } from "@/lib/hooks/use-orders"
import { useProfiles } from "@/lib/hooks/use-admin-data"
import { useCurrentUser } from "@/lib/store/auth"
import { setUserRole } from "@/lib/services/admin-customers"
import { computeCustomerRows, type CustomerRow } from "@/lib/admin/customer-rows"
import { formatOrderDate } from "@/lib/date"
import { formatPrice } from "@/lib/currency"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

// Every account, with its role. An admin can make someone an admin or take
// that away again, after confirming; never for their own account, so they
// can't lock themselves out (and there is always at least one admin).
function AdminCustomersContent() {
  const t = useT()
  const me = useCurrentUser()
  const { data: profiles, loading: profilesLoading, reload } = useProfiles()
  const { data: orders, loading: ordersLoading } = useAllOrders()
  // Kept after closing, so the dialog's text doesn't change while it fades out.
  const [pending, setPending] = useState<CustomerRow | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  if (profilesLoading || ordersLoading) return <TableSkeleton columns={8} />

  if (!profiles || !orders) {
    return <p className="text-sm text-error">{t("admin.loadFailed.customers")}</p>
  }

  const rows = computeCustomerRows(profiles, orders)

  if (rows.length === 0) {
    return <EmptyState icon={Users} title={t("admin.customers.empty")} />
  }

  const promoting = pending?.role === "customer"

  async function handleConfirm() {
    if (!pending) return
    setSaving(true)
    const result = await setUserRole(pending.id, promoting ? "admin" : "customer")
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(
      promoting
        ? t("admin.customers.madeAdmin", { name: pending.fullName })
        : t("admin.customers.removedAdmin", { name: pending.fullName })
    )
    setConfirmOpen(false)
    reload()
  }

  return (
    <>
      <Table label={t("admin.customers.title")}>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.customers.columns.customer")}</TableHead>
            <TableHead>{t("admin.customers.columns.email")}</TableHead>
            <TableHead>{t("admin.customers.columns.phone")}</TableHead>
            <TableHead>{t("admin.customers.columns.role")}</TableHead>
            <TableHead>{t("admin.customers.columns.orders")}</TableHead>
            <TableHead>{t("admin.customers.columns.totalSpent")}</TableHead>
            <TableHead>{t("admin.customers.columns.joined")}</TableHead>
            <TableHead>
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isAdmin = row.role === "admin"
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell className="whitespace-nowrap">{row.email}</TableCell>
                <TableCell className="whitespace-nowrap">{row.phone ?? "—"}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                      isAdmin ? "bg-forest text-white" : "bg-cream text-charcoal"
                    )}
                  >
                    {isAdmin ? t("admin.customers.roleAdmin") : t("admin.customers.roleCustomer")}
                  </span>
                </TableCell>
                <TableCell>{row.orderCount}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPrice(row.totalSpent, t)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatOrderDate(row.joinedAt, t.locale)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.id === me?.id ? (
                    <span className="text-sm text-muted-text">{t("admin.customers.you")}</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={
                        isAdmin
                          ? t("admin.customers.removeAdminLabel", { name: row.fullName })
                          : t("admin.customers.makeAdminLabel", { name: row.fullName })
                      }
                      onClick={() => {
                        setPending(row)
                        setConfirmOpen(true)
                      }}
                    >
                      {isAdmin ? t("admin.customers.removeAdmin") : t("admin.customers.makeAdmin")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending &&
                (promoting
                  ? t("admin.customers.makeAdminTitle", { name: pending.fullName })
                  : t("admin.customers.removeAdminTitle", { name: pending.fullName }))}
            </DialogTitle>
            <DialogDescription>
              {promoting ? t("admin.customers.makeAdminText") : t("admin.customers.removeAdminText")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant={promoting ? "default" : "destructive"} disabled={saving} onClick={handleConfirm}>
              {promoting ? t("admin.customers.makeAdmin") : t("admin.customers.removeAdmin")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AdminCustomersContent }
