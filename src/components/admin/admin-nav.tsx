"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Home } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import type { MessageKey } from "@/lib/i18n/translator"

const ADMIN_NAV_ITEMS: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/admin", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "admin.nav.products", icon: Package },
  { href: "/admin/categories", label: "admin.nav.categories", icon: FolderTree },
  { href: "/admin/orders", label: "admin.nav.orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "admin.nav.customers", icon: Users },
  { href: "/admin/homepage", label: "admin.nav.homepage", icon: Home },
]

// Plain exact-match, same reasoning as AccountNav: "/admin" would
// prefix-match every other item here, wrongly showing Dashboard as active
// on every subsection.
function isActive(pathname: string, href: string): boolean {
  return pathname === href
}

function AdminNav() {
  const t = useT()
  const pathname = usePathname()

  return (
    <nav aria-label={t("admin.nav.label")} className="space-y-2 lg:space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm transition-colors lg:border-transparent lg:bg-transparent lg:p-2",
              active ? "bg-cream font-medium text-forest" : "text-charcoal hover:bg-cream/70"
            )}
          >
            <Icon aria-hidden className="size-4" />
            {t(item.label)}
          </Link>
        )
      })}
    </nav>
  )
}

export { AdminNav }
