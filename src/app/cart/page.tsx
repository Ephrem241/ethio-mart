import { CartContents } from "@/components/cart/cart-contents"

export default function CartPage() {
  return (
    <div className="space-y-8 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Your Cart</h1>
        <p className="text-muted-text">Review your items before checkout.</p>
      </div>
      <CartContents />
    </div>
  )
}
