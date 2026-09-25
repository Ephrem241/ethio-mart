import Link from "next/link"
import { PackageX } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

export default async function ProductNotFound() {
  const t = await getT()

  return (
    <div className="py-16">
      <EmptyState
        titleAs="h1"
        icon={PackageX}
        title={t("catalog.productNotFound")}
        description={t("catalog.productNotFoundText")}
        action={
          <Button asChild>
            <Link href="/shop">{t("nav.shopAll")}</Link>
          </Button>
        }
      />
    </div>
  )
}
