"use client"

import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { ProfileForm } from "@/components/account/profile-form"

function AccountProfileContent() {
  const { user, ready } = useRequireAuth("/login?redirect=/account")

  if (!ready || !user) return null

  return (
    <div className="max-w-md rounded-card border border-border bg-card p-5">
      <ProfileForm user={user} />
    </div>
  )
}

export { AccountProfileContent }
