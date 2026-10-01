"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Home, Mail } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import type { MessageKey } from "@/lib/i18n/translator"
import { useUnreadMessageCount } from "@/lib/hooks/use-admin-data"
import { MESSAGES_CHANGED_EVENT } from "@/lib/services/admin-messages"

const ADMIN_NAV_ITEMS: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/admin", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "admin.nav.products", icon: Package },
  { href: "/admin/categories", label: "admin.nav.categories", icon: FolderTree },
  { href: "/admin/orders", label: "admin.nav.orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "admin.nav.customers", icon: Users },
  { href: "/admin/messages", label: "admin.nav.messages", icon: Mail },
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
  const { data: unread, reload: reloadUnread } = useUnreadMessageCount()

  // Fresh on every admin page, and whenever a message is read, answered or
  // deleted (see admin-messages.ts).
  useEffect(() => {
    reloadUnread()
  }, [pathname, reloadUnread])
  useEffect(() => {
    window.addEventListener(MESSAGES_CHANGED_EVENT, reloadUnread)
    return () => window.removeEventListener(MESSAGES_CHANGED_EVENT, reloadUnread)
  }, [reloadUnread])

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
            {item.href === "/admin/messages" && !!unread && (
              <span className="ml-auto rounded-full bg-forest px-2 py-0.5 text-xs font-medium text-white">
                <span aria-hidden>{unread}</span>
                <span className="sr-only"> ({t.plural("admin.messages.unreadCount", unread)})</span>
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export { AdminNav }
