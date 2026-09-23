"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Store, LayoutGrid, Package, User } from "lucide-react"
import { cn } from "cn"

import { isActivePath } from "@/components/navigation/is-active-path"
import { useCurrentUser } from "@/lib/store/auth"

const baseItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/account/orders", label: "Orders", icon: Package },
]

function BottomNav() {
  const pathname = usePathname()
  const user = useCurrentUser()
  const items = [
    ...baseItems,
    { href: user ? "/account" : "/login", label: "Profile", icon: User },
  ]

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-background lg:hidden"
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
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              active ? "text-burgundy" : "text-muted-text"
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { BottomNav }
