"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { useCartStore, selectCartCount } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"

// Links straight to /cart rather than opening a mini-cart drawer. Spec
// Sections 46/71 frame a desktop drawer as explicitly optional ("if
// appropriate"), and its actual requirement — a non-redirecting add-to-cart
// confirmation with a "View cart" action — is already met by the toast in
// useAddToCart. /cart itself is a client-only, localStorage-only render
// with no network round trip, so a drawer wouldn't save a real page-load
// cost either. Deliberately deferred, not overlooked.
//
// `variant="stacked"` is the desktop header's icon-over-label link; the
// default is the compact icon button used on phones.
function CartButton({
  className,
  variant = "icon",
}: {
  className?: string
  variant?: "icon" | "stacked"
}) {
  const t = useT()
  const count = useCartStore(selectCartCount)
  const label = count > 0 ? t.plural("nav.cartCount", count) : t("nav.cart")
  const badge = count > 0 && (
    <span
      aria-hidden
      className="absolute -top-1 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] leading-none font-bold text-forest-dark ring-2 ring-background"
    >
      {count > 99 ? "99+" : count}
    </span>
  )

  if (variant === "stacked") {
    return (
      <Link
        href="/cart"
        aria-label={label}
        className={cn(
          "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-charcoal transition-colors outline-none hover:text-forest focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <span className="relative">
          <ShoppingBag aria-hidden className="size-[22px]" strokeWidth={1.75} />
          {badge}
        </span>
        <span aria-hidden className="text-[11px] leading-none font-medium">
          {t("nav.cart")}
        </span>
      </Link>
    )
  }

  return (
    <Button variant="ghost" size="icon-lg" asChild className={cn("relative", className)}>
      <Link href="/cart" aria-label={label}>
        <span className="relative">
          <ShoppingBag aria-hidden className="size-[22px]" strokeWidth={1.75} />
          {badge}
        </span>
      </Link>
    </Button>
  )
}

export { CartButton }
