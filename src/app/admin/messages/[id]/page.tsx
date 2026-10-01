import type { Metadata } from "next"

import { getT } from "@/lib/i18n/server"
import { privateMetadata } from "@/lib/seo/metadata"
import { AdminMessageDetailContent } from "@/components/admin/admin-message-detail-content"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("admin.messages.title"))
}

export default async function AdminMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <AdminMessageDetailContent messageId={id} />
}
