import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import { getT } from "@/lib/i18n/server"
import { AccountOrdersContent } from "@/components/account/account-orders-content"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("account.orders.title"))
}

export default async function Page() {
  const t = await getT()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">{t("account.orders.title")}</h1>
        <p className="text-muted-text">{t("account.orders.subtitle")}</p>
      </div>
      <AccountOrdersContent />
    </div>
  )
}
