"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, ShoppingBag, Heart, User } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import type { MessageKey } from "@/lib/i18n/translator"
import { useCurrentUser } from "@/lib/store/auth"
import { useCartStore, selectCartCount } from "@/lib/store/cart"

function BottomNav() {
  const t = useT()
  const pathname = usePathname()
  const user = useCurrentUser()
  const cartCount = useCartStore(selectCartCount)

  // The product page has its own sticky Add to Cart / Buy Now bar, which
  // takes this bar's place there — showing both would stack two fixed bottom
  // bars and eat into the one screen where extra room matters most.
  if (pathname.startsWith("/product/")) return null

  const items: { href: string; label: MessageKey; icon: typeof Home }[] = [
    { href: "/", label: "nav.home", icon: Home },
    { href: "/categories", label: "nav.categories", icon: LayoutGrid },
    { href: "/cart", label: "nav.cart", icon: ShoppingBag },
    { href: "/account/favorites", label: "nav.wishlist", icon: Heart },
    { href: user ? "/account" : "/login", label: "nav.account", icon: User },
  ]

  return (
    <nav
      aria-label={t("nav.primaryMobile")}
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md lg:hidden"
    >
      {items.map((item) => {
        // Plain prefix matching would also mark "Account" active on
        // /account/favorites (it starts with "/account/"), highlighting two
        // tabs at once now that Wishlist is its own tab.
        const active =
          item.href === "/account"
            ? pathname === "/account" || (pathname.startsWith("/account/") && !pathname.startsWith("/account/favorites"))
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        const showBadge = item.href === "/cart" && cartCount > 0
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            // The badge itself is hidden from screen readers; the count is
            // read out here instead, as the header's cart button does.
            aria-label={showBadge ? t.plural("nav.cartCount", cartCount) : undefined}
            className={cn(
              "relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-medium transition-colors outline-none focus-visible:bg-cream active:bg-cream/70",
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
            <span className="relative">
              <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
              {showBadge && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] leading-none font-bold text-forest-dark ring-2 ring-background"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            <span className="max-w-full truncate">{t(item.label)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { BottomNav }
