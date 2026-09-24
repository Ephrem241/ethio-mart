import { getT } from "@/lib/i18n/server"

async function AuthDivider() {
  const t = await getT()

  return (
    <div className="flex items-center gap-3 text-xs text-muted-text" role="separator" aria-label={t("auth.or")}>
      <span className="h-px flex-1 bg-border" />
      {t("auth.or")}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export { AuthDivider }
