"use client"

import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { formatOrderDate } from "@/lib/date"
import { ChangePasswordForm } from "@/components/account/change-password-form"

function AccountSettingsContent() {
  const { user, ready } = useRequireAuth("/login?redirect=/account/settings")

  if (!ready || !user) return null

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-1 rounded-card border border-border bg-card p-5 text-sm">
        <p className="text-charcoal">
          Member since <span className="font-medium">{formatOrderDate(user.createdAt)}</span>
        </p>
        <p className="text-charcoal">
          Role: <span className="font-medium">{user.role === "admin" ? "Admin" : "Customer"}</span>
        </p>
      </div>

      <div className="space-y-3 rounded-card border border-border bg-card p-5">
        <h2 className="font-medium text-charcoal">Change password</h2>
        <ChangePasswordForm userId={user.id} />
      </div>
    </div>
  )
}

export { AccountSettingsContent }
