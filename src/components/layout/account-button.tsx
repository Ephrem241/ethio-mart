"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { useCurrentUser } from "@/lib/store/auth"
import { Button } from "@/components/ui/button"

// `variant="stacked"` is the desktop header's icon-over-label link.
function AccountButton({
  className,
  variant = "icon",
}: {
  className?: string
  variant?: "icon" | "stacked"
}) {
  const t = useT()
  const user = useCurrentUser()
  const label = user ? t("nav.account") : t("nav.signIn")
  const href = user ? "/account" : "/login"

  if (variant === "stacked") {
    return (
      <Link
        href={href}
        className={cn(
          "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-charcoal transition-colors outline-none hover:text-forest focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <User aria-hidden className="size-[22px]" strokeWidth={1.75} />
        <span className="text-[11px] leading-none font-medium">{label}</span>
      </Link>
    )
  }

  return (
    <Button variant="ghost" size="icon-lg" asChild className={className}>
      <Link href={href} aria-label={label}>
        <User aria-hidden className="size-[22px]" strokeWidth={1.75} />
      </Link>
    </Button>
  )
}

export { AccountButton }
