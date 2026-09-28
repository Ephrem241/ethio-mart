"use client"

import { useT } from "@/lib/i18n/provider"
import { Button } from "@/components/ui/button"

// The product page's actions on phones and tablets: Add to cart and Buy now,
// pinned to the bottom of the screen in BottomNav's place (BottomNav is not
// shown on product pages). The bottom padding keeps the buttons clear of the
// iPhone home indicator. ProductPurchaseActions renders it and hands it its own
// handlers, so these buttons use the quantity chosen on the page; the inline
// pair there is desktop-only.
function MobilePurchaseBar({
  outOfStock,
  onAddToCart,
  onBuyNow,
}: {
  outOfStock: boolean
  onAddToCart: () => void
  onBuyNow: () => void
}) {
  const t = useT()

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pt-3 pr-[max(0.75rem,env(safe-area-inset-right))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] shadow-[0_-8px_24px_-12px_rgb(23_23_23/0.18)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-2.5">
        <Button size="lg" className="min-w-0 px-3" disabled={outOfStock} onClick={onAddToCart}>
          {outOfStock ? t("product.stock.out") : t("product.addToCart")}
        </Button>
        <Button size="lg" variant="outline" className="min-w-0 px-3" disabled={outOfStock} onClick={onBuyNow}>
          {t("product.buyNow")}
        </Button>
      </div>
    </div>
  )
}

export { MobilePurchaseBar }
