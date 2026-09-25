"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

// Catches an unexpected error while rendering a page, inside the normal
// layout (header, footer and the language switcher still work).
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="py-16">
      <EmptyState
        titleAs="h1"
        icon={AlertTriangle}
        title={t("common.somethingWentWrong")}
        action={<Button onClick={reset}>{t("common.retry")}</Button>}
      />
    </div>
  )
}
