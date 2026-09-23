"use client"

import type { ReactNode } from "react"

import { AccountNav } from "@/components/account/account-nav"

function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6 py-8 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8 lg:space-y-0">
      <AccountNav />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export { AccountShell }
