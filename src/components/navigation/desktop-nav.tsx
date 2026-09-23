"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import { isActivePath } from "@/components/navigation/is-active-path"

const items = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
]

function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation" className="flex h-11 items-center gap-6">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sm font-medium transition-colors hover:text-burgundy",
              active ? "text-burgundy" : "text-charcoal"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { DesktopNav }
