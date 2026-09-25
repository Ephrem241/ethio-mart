import { PackageX } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { EmptyState } from "@/components/feedback/empty-state"

export default async function CategoryNotFound() {
  const t = await getT()

  return (
    <div className="py-16">
      <EmptyState
        titleAs="h1"
        icon={PackageX}
        title={t("catalog.categoryNotFound")}
        description={t("catalog.categoryNotFoundText")}
      />
    </div>
  )
}
