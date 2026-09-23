import { AdminProductEditContent } from "@/components/admin/admin-product-edit-content"

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Edit product</h1>
      </div>
      <AdminProductEditContent productId={id} />
    </div>
  )
}
