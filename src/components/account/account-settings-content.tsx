"use client"

import { FormSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"

import { useT } from "@/lib/i18n/provider"
import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { formatOrderDate } from "@/lib/date"
import { ChangePasswordForm } from "@/components/account/change-password-form"

function AccountSettingsContent() {
  const t = useT()
  const { user, ready } = useRequireAuth("/login?redirect=/account/settings")

  if (!ready || !user) return <FormSkeleton fields={2} />

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-1 rounded-card border border-border bg-card p-5 text-sm">
        <p className="text-charcoal">
          {t("account.settings.memberSince", { date: formatOrderDate(user.createdAt, t.locale) })}
        </p>
        <p className="text-charcoal">
          {t("account.settings.role", {
            role: user.role === "admin" ? t("account.settings.roleAdmin") : t("account.settings.roleCustomer"),
          })}
        </p>
      </div>

      <div className="space-y-3 rounded-card border border-border bg-card p-5">
        <h2 className="font-medium text-charcoal">{t("account.settings.password")}</h2>
        {user.hasPassword ? (
          <ChangePasswordForm userId={user.id} />
        ) : (
          // Changing a password means proving the current one, and this
          // account has none — it only ever signed in with Google.
          <p className="text-sm text-muted-text">
            {t("account.settings.googleOnly")}{" "}
            <Link href="/forgot-password" className="text-forest hover:underline">
              {t("auth.login.forgot")}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export { AccountSettingsContent }
