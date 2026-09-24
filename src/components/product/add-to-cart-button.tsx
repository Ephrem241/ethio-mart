"use client"

import { useT } from "@/lib/i18n/provider"
import { useAddToCart } from "@/lib/hooks/use-add-to-cart"
import { Button } from "@/components/ui/button"

// The card's "Add to Cart": a small client island (it needs the cart store and
// a toast) so the card around it can stay a Server Component. It reuses the
// same hook as the product page, so the confirmation toast ("Added to your
// cart" + View cart) is identical everywhere.
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
      className={className}
    >
      {outOfStock ? t("product.stock.out") : t("product.addToCart")}
    </Button>
  )
}

export { AddToCartButton }
