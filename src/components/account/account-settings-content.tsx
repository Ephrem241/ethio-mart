"use client"

import Link from "next/link"

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
        <h2 className="font-medium text-charcoal">Password</h2>
        {user.hasPassword ? (
          <ChangePasswordForm userId={user.id} />
        ) : (
          // Changing a password means proving the current one, and this
          // account has none — it only ever signed in with Google.
          <p className="text-sm text-muted-text">
            You sign in with Google, so there&apos;s no password to change. To also log in with your
            email and a password, use{" "}
            <Link href="/forgot-password" className="text-burgundy hover:underline">
              Forgot your password?
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export { AccountSettingsContent }
