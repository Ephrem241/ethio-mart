"use client"

import { CartSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { Package, ShoppingBag } from "lucide-react"

import { formatPrice } from "@/lib/currency"
import { useT } from "@/lib/i18n/provider"
import { useCartStore } from "@/lib/store/cart"
import { useProductsByIds } from "@/lib/hooks/use-products-by-ids"
import { resolveCartLines, computeCartTotals } from "@/lib/cart-math"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import { CartLineItem } from "@/components/cart/cart-line-item"
import { OrderSummary } from "@/components/cart/order-summary"

function CartContents() {
  const t = useT()
  const items = useCartStore((s) => s.items)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const removeItem = useCartStore((s) => s.removeItem)
  const { products, loading } = useProductsByIds(items.map((i) => i.productId))

  // Render nothing until persist finishes reading localStorage — otherwise
  // a user with a real saved cart would briefly see the empty-cart state
  // before it flips to their actual items.
  if (!hasHydrated) return <CartSkeleton />

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t("cart.emptyTitle")}
        description={t("cart.emptyText")}
        action={
          <Button asChild size="lg">
            <Link href="/shop">{t("cart.startShopping")}</Link>
          </Button>
        }
      />
    )
  }

  // Product details are looked up from the database; don't judge any line
  // "unavailable" until that lookup has actually come back.
  if (loading) return <CartSkeleton />

  const { resolvedLines, unavailableLines } = resolveCartLines(items, products)
  const { subtotal, savings: totalSavings } = computeCartTotals(resolvedLines)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-3">
        {resolvedLines.map(({ line, product }) => (
          <CartLineItem key={product.id} line={line} product={product} />
        ))}
        {unavailableLines.map((line) => (
          <div
            key={line.productId}
            className="flex items-center gap-4 rounded-card border border-border/70 bg-card p-4 text-sm text-muted-text shadow-soft"
          >
            <Package aria-hidden className="size-8 shrink-0" />
            <p className="flex-1">{t("cart.unavailable")}</p>
            <Button variant="ghost" size="sm" onClick={() => removeItem(line.productId)}>
              {t("cart.remove")}
            </Button>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-32">
        <OrderSummary
          subtotal={subtotal}
          totalSavings={totalSavings}
          canCheckout={resolvedLines.length > 0}
          ctaDesktopOnly
        />
      </div>

      {/* Phones and tablets: the total and the checkout button stay at the
          bottom of the screen, just above the bottom navigation (4rem, its
          1px top border and the home-indicator inset), while the
          cart scrolls. Sticky rather than fixed, so it comes to rest after the
          summary at the end of the cart instead of covering the footer. (The
          summary's own button is hidden there, see ctaDesktopOnly.) */}
      <div className="sticky bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center gap-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <div className="shrink-0">
          <p className="text-xs text-muted-text">{t("cart.summary.total")}</p>
          <p className="text-lg leading-tight font-semibold text-forest tabular-nums">{formatPrice(subtotal, t)}</p>
        </div>
        {resolvedLines.length > 0 ? (
          <Button asChild size="lg" className="min-w-0 flex-1">
            <Link href="/checkout">{t("cart.summary.continue")}</Link>
          </Button>
        ) : (
          <Button size="lg" className="min-w-0 flex-1" disabled>
            {t("cart.summary.continue")}
          </Button>
        )}
      </div>
    </div>
  )
}

export { CartContents }
