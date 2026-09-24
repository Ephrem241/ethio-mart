import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import { getT } from "@/lib/i18n/server"
import { AdminOrdersContent } from "@/components/admin/admin-orders-content"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("admin.orders.title"))
}

export default async function Page() {
  const t = await getT()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">{t("admin.orders.title")}</h1>
        <p className="text-muted-text">{t("admin.orders.subtitle")}</p>
      </div>
      <AdminOrdersContent />
    </div>
  )
}
