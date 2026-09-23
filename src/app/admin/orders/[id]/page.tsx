import { AdminOrderDetailContent } from "@/components/admin/admin-order-detail-content"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AdminOrderDetailContent orderId={id} />
}
