import type { Metadata } from "next"

import { getT } from "@/lib/i18n/server"
import { privateMetadata } from "@/lib/seo/metadata"
import { OrderSuccessContent } from "@/components/order/order-success-content"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("order.success.title"))
}

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
