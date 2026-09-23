import { AdminProductForm } from "@/components/admin/admin-product-form"

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">New product</h1>
      </div>
      <AdminProductForm />
    </div>
  )
}
