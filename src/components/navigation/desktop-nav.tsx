"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import { isActivePath } from "@/components/navigation/is-active-path"
import { useT } from "@/lib/i18n/provider"

export interface NavLink {
  href: string
  label: string
}

// The second row of the desktop header. The links are built on the server
// (Home, Shop, the shop's own categories from the database, Deals, Shop All) —
// this only adds the "you are here" state, which needs the current path.
function DesktopNav({ links }: { links: NavLink[] }) {
  const t = useT()
  const pathname = usePathname()

  return (
    <nav aria-label={t("nav.primary")} className="flex h-12 items-center justify-center gap-7 xl:gap-9">
      {links.map((link) => {
        const active = isActivePath(pathname, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-full items-center text-[13.5px] font-medium tracking-wide whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
              active
                ? "text-forest after:bg-gold"
                : "text-charcoal/80 after:bg-transparent hover:text-forest hover:after:bg-forest/20"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { DesktopNav }
