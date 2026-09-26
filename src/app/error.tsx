"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

// Catches an unexpected error while rendering a page, inside the normal
// layout (header, footer and the language switcher still work).
//
// "Try again" must be `retry`, not `reset`: `reset` only clears the error and
// shows the SAME server response again, so a failure that happened on the
// server (the database briefly unreachable, a timeout) would just reappear.
// `retry` asks the server to render the page again.
export default function RouteError({ error, retry }: { error: Error; retry: () => void }) {
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
        action={<Button onClick={retry}>{t("common.retry")}</Button>}
      />
    </div>
  )
}
