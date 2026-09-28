"use client"

import { ShoppingCartPlus } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { Button } from "@/components/ui/button"

// The card's "Add to Cart": a small client island (it needs the cart store and
// a toast) so the card around it can stay a Server Component. It reuses the
// same hook as the product page, so the confirmation toast ("Added to your
// cart" + View cart) is identical everywhere.
//
// Below `lg` it is a round 44px icon button that the card places beside the
// price, the way shopping apps do; the words stay as its (visually hidden)
// name. From `lg` up it is the full-width text button, as before.
function AddToCartButton({
  productId,
  outOfStock,
  className,
}: {
  productId: string
  outOfStock?: boolean
  className?: string
}) {
  const t = useT()
  const addToCart = useAddToCart()

  return (
    <Button
      type="button"
      size="sm"
      disabled={outOfStock}
      onClick={() => addToCart(productId)}
      className={cn("max-lg:size-11 max-lg:shrink-0 max-lg:rounded-full max-lg:p-0", className)}
    >
      <ShoppingCartPlus aria-hidden className="size-5 lg:hidden" />
      <span className="max-lg:sr-only">{outOfStock ? t("product.stock.out") : t("product.addToCart")}</span>
    </Button>
  )
}

export { AddToCartButton }
