import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import { getT } from "@/lib/i18n/server"
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("admin.dashboard.title"))
}

export default async function Page() {
  const t = await getT()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">{t("admin.dashboard.title")}</h1>
        <p className="text-muted-text">{t("admin.dashboard.subtitle")}</p>
      </div>
      <AdminDashboardContent />
    </div>
  )
}
