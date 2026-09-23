import { AdminOrdersContent } from "@/components/admin/admin-orders-content"

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Orders</h1>
        <p className="text-muted-text">Manage and track customer orders.</p>
      </div>
      <AdminOrdersContent />
    </div>
  )
}
