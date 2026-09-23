"use client"

import type { ReactNode } from "react"

import { useRequireAdmin } from "@/lib/hooks/use-require-admin"
import { AdminNav } from "@/components/admin/admin-nav"

// The single authorization gate for every /admin/* page — centralized here
// rather than per-content-component (unlike /account's pattern) because
// spec Section 58 warns "do not rely only on hiding frontend links": a gate
// that every individual admin page must remember to call is one more place
// a future admin page could simply forget it. Children never render until
// `ready`, so no admin chrome or data is ever visible even momentarily to a
// non-admin visitor.
function AdminShell({ children }: { children: ReactNode }) {
  const { ready } = useRequireAdmin()

  if (!ready) return null

  return (
    <div className="space-y-6 py-8 lg:grid lg:grid-cols-[220px_1fr] lg:items-start lg:gap-8 lg:space-y-0">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export { AdminShell }
