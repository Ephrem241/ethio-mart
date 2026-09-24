"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Store, LayoutGrid, Package, User } from "lucide-react"
import { cn } from "cn"

import { isActivePath } from "@/components/navigation/is-active-path"
import { useT } from "@/lib/i18n/provider"
import type { MessageKey } from "@/lib/i18n/translator"
import { useCurrentUser } from "@/lib/store/auth"

const baseItems: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/", label: "nav.home", icon: Home },
  { href: "/shop", label: "nav.shop", icon: Store },
  { href: "/categories", label: "nav.categories", icon: LayoutGrid },
  { href: "/account/orders", label: "nav.orders", icon: Package },
]

function BottomNav() {
  const t = useT()
  const pathname = usePathname()
  const user = useCurrentUser()
  const items = [
    ...baseItems,
    { href: user ? "/account" : "/login", label: "nav.profile" as const, icon: User },
  ]

  return (
    <nav
      aria-label={t("nav.primaryMobile")}
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-medium transition-colors outline-none focus-visible:bg-cream",
              active ? "text-forest" : "text-muted-text"
            )}
          >
            {/* A short bar on top of the active tab: the state is not carried by colour alone. */}
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 rounded-full transition-colors",
                active ? "bg-forest" : "bg-transparent"
              )}
            />
            <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
            <span className="max-w-full truncate">{t(item.label)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { BottomNav }
