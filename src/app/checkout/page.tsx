import { CheckoutContent } from "@/components/checkout/checkout-content"

export default function CheckoutPage() {
  return (
    <div className="space-y-8 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Checkout</h1>
        <p className="text-muted-text">Review your delivery and payment details.</p>
      </div>
      <CheckoutContent />
    </div>
  )
}
