import Link from "next/link"
import { PackageX } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

export default async function CategoryNotFound() {
  const t = await getT()

  return (
    <div className="py-16">
      <EmptyState
        titleAs="h1"
        icon={PackageX}
        title={t("catalog.categoryNotFound")}
        description={t("catalog.categoryNotFoundText")}
        action={
          <Button asChild>
            <Link href="/categories">{t("nav.categories")}</Link>
          </Button>
        }
      />
    </div>
  )
}
