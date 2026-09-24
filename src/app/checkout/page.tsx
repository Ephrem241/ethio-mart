import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import { getT } from "@/lib/i18n/server"
import { CheckoutContent } from "@/components/checkout/checkout-content"
import { PageHeader } from "@/components/layout/page-header"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("checkout.title"))
}

export default async function CheckoutPage() {
  const t = await getT()

  return (
    <div className="space-y-8 py-6 lg:py-8">
      <PageHeader variant="plain" title={t("checkout.title")} description={t("checkout.subtitle")} />
      <CheckoutContent />
    </div>
  )
}
