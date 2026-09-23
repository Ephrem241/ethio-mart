"use client"

import Link from "next/link"
import { Package, ShoppingBag } from "lucide-react"

import { useCartStore } from "@/lib/store/cart"
import { useProductsByIds } from "@/lib/hooks/use-products-by-ids"
import { resolveCartLines, computeCartTotals } from "@/lib/cart-math"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import { CartLineItem } from "@/components/cart/cart-line-item"
import { OrderSummary } from "@/components/cart/order-summary"

function CartContents() {
  const items = useCartStore((s) => s.items)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const removeItem = useCartStore((s) => s.removeItem)
  const { products, loading } = useProductsByIds(items.map((i) => i.productId))

  // Render nothing until persist finishes reading localStorage — otherwise
  // a user with a real saved cart would briefly see the empty-cart state
  // before it flips to their actual items.
  if (!hasHydrated) return null

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is waiting."
        description="Add something you love to get started."
        action={
          <Button asChild>
            <Link href="/shop">Start shopping</Link>
          </Button>
        }
      />
    )
  }

  // Product details are looked up from the database; don't judge any line
  // "unavailable" until that lookup has actually come back.
  if (loading) return null

  const { resolvedLines, unavailableLines } = resolveCartLines(items, products)
  const { subtotal, savings: totalSavings } = computeCartTotals(resolvedLines)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {resolvedLines.map(({ line, product }) => (
          <CartLineItem key={product.id} line={line} product={product} />
        ))}
        {unavailableLines.map((line) => (
          <div
            key={line.productId}
            className="flex items-center gap-4 border-b border-border py-4 text-sm text-muted-text last:border-b-0"
          >
            <Package aria-hidden className="size-8 shrink-0" />
            <p className="flex-1">This item is no longer available.</p>
            <Button variant="ghost" size="sm" onClick={() => removeItem(line.productId)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <OrderSummary
        subtotal={subtotal}
        totalSavings={totalSavings}
        canCheckout={resolvedLines.length > 0}
      />
    </div>
  )
}

export { CartContents }
