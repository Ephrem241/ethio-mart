"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Home } from "lucide-react"
import { cn } from "cn"

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
] as const

// Plain exact-match, same reasoning as AccountNav: "/admin" would
// prefix-match every other item here, wrongly showing Dashboard as active
// on every subsection.
function isActive(pathname: string, href: string): boolean {
  return pathname === href
}

function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="space-y-2 lg:space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors lg:border-transparent lg:p-2",
              active ? "bg-sand/50 text-burgundy" : "text-charcoal hover:bg-sand/30"
            )}
          >
            <Icon aria-hidden className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { AdminNav }
