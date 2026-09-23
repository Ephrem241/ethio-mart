import { AdminCategoriesContent } from "@/components/admin/admin-categories-content"

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Categories</h1>
        <p className="text-muted-text">Organize your product catalog.</p>
      </div>
      <AdminCategoriesContent />
    </div>
  )
}
