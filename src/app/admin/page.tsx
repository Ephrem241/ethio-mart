import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-muted-text">An overview of your store.</p>
      </div>
      <AdminDashboardContent />
    </div>
  )
}
