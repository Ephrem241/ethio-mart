import { AdminProductsContent } from "@/components/admin/admin-products-content"

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Products</h1>
        <p className="text-muted-text">Manage your product catalog.</p>
      </div>
      <AdminProductsContent />
    </div>
  )
}
