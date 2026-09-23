import { OrderSuccessContent } from "@/components/order/order-success-content"

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="py-8">
      <OrderSuccessContent orderId={id} />
    </div>
  )
}
