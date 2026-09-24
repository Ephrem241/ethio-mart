import type { Metadata } from "next"

import { getT } from "@/lib/i18n/server"
import { privateMetadata } from "@/lib/seo/metadata"
import { AdminOrderDetailContent } from "@/components/admin/admin-order-detail-content"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("admin.orders.title"))
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AdminOrderDetailContent orderId={id} />
}
