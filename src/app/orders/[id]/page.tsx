import { OrderDetailContent } from "@/components/order/order-detail-content"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="py-8">
      <OrderDetailContent orderId={id} />
    </div>
  )
}
