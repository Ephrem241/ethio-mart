import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

// The site-wide 404 (any URL that matches no route, e.g. a footer link to a
// page that isn't built yet). Next's built-in one is English-only.
export default async function NotFound() {
  const t = await getT()

  return (
    <div className="py-16">
      <EmptyState
        titleAs="h1"
        icon={FileQuestion}
        title={t("common.pageNotFound")}
        description={t("common.pageNotFoundText")}
        action={
          <Button asChild>
            <Link href="/">{t("common.backHome")}</Link>
          </Button>
        }
      />
    </div>
  )
}
