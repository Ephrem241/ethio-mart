import { AdminCustomersContent } from "@/components/admin/admin-customers-content"

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Customers</h1>
        <p className="text-muted-text">A read-only view of your customers.</p>
      </div>
      <AdminCustomersContent />
    </div>
  )
}
