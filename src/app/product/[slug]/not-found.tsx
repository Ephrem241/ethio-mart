import { PackageX } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { EmptyState } from "@/components/feedback/empty-state"

export default async function ProductNotFound() {
  const t = await getT()

  return (
    <div className="py-16">
      <EmptyState
        icon={PackageX}
        title={t("catalog.productNotFound")}
        description={t("catalog.productNotFoundText")}
      />
    </div>
  )
}
