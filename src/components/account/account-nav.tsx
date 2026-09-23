"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, Heart, LogOut, MapPin, Package, Settings, User } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { useCurrentUser } from "@/lib/store/auth"
import { signOut } from "@/lib/services/auth"
import { Button } from "@/components/ui/button"

const ACCOUNT_NAV_ITEMS = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings },
] as const

// Plain exact-match, not the shared isActivePath prefix-matcher: "/account"
// would prefix-match every other item here (isActivePath treats "/account"
// as a parent of "/account/orders"), which would wrongly show Profile as
// active on every subsection. None of these five routes have their own
// nested children in this phase, so exact match is simply correct.
function isActive(pathname: string, href: string): boolean {
  return pathname === href
}

function AccountNav() {
  const pathname = usePathname()
  const user = useCurrentUser()
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    toast.success("You've been logged out.")
    router.push("/")
  }

  return (
    <div className="space-y-4">
      {user && (
        <div className="flex items-center gap-3 rounded-card border border-border bg-card p-4 lg:hidden">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sand">
            <User aria-hidden className="size-6 text-burgundy" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-charcoal">{user.fullName}</p>
            <p className="truncate text-sm text-muted-text">{user.email}</p>
          </div>
        </div>
      )}

      <nav aria-label="Account" className="space-y-2 lg:space-y-1">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border p-3 text-sm transition-colors lg:justify-start lg:gap-2 lg:border-transparent lg:p-2",
                active
                  ? "bg-sand/50 text-burgundy lg:bg-sand/50"
                  : "text-charcoal hover:bg-sand/30"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon aria-hidden className="size-4" />
                {item.label}
              </span>
              <ChevronRight aria-hidden className="size-4 text-muted-text lg:hidden" />
            </Link>
          )
        })}
      </nav>

      <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="size-4" />
        Log out
      </Button>
    </div>
  )
}

export { AccountNav }
