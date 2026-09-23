"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { cn } from "cn"

import { useCartStore, selectCartCount } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"

// Links straight to /cart rather than opening a mini-cart drawer. Spec
// Sections 46/71 frame a desktop drawer as explicitly optional ("if
// appropriate"), and its actual requirement — a non-redirecting add-to-cart
// confirmation with a "View cart" action — is already met by the toast in
// useAddToCart. /cart itself is a client-only, localStorage-only render
// with no network round trip, so a drawer wouldn't save a real page-load
// cost either. Deliberately deferred, not overlooked.
function CartButton({ className }: { className?: string }) {
  const count = useCartStore(selectCartCount)

  return (
    <Button variant="ghost" size="icon" asChild className={cn("relative", className)}>
      <Link href="/cart" aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}>
        <ShoppingBag />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  )
}

export { CartButton }
