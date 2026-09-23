// Payment provider abstraction (spec Section 57): "Do not hardwire checkout
// directly to one provider." Adding Chapa/Telebirr later means adding
// another PaymentProvider to the array below and flipping `enabled: true` —
// no checkout code changes.
//
// NOTE for that day: a real online provider cannot be trusted to report
// "paid" from the browser. The order's payment_status is set by the database
// (place_order: cash on delivery => pending) and an online provider must
// confirm payment server-side (order first, then a webhook) — that needs a
// server route holding the provider's secret and is deliberately not faked
// here.

export type PaymentStatus = "pending" | "paid" | "failed"

export interface PaymentResult {
  success: boolean
  paymentStatus: PaymentStatus
  error?: string
}

export interface PaymentProvider {
  id: string
  label: string
  description?: string
  enabled: boolean
  process(context: { total: number }): Promise<PaymentResult>
}

export const cashOnDeliveryProvider: PaymentProvider = {
  id: "cod",
  label: "Cash on Delivery",
  description: "Pay in cash when your order arrives.",
  enabled: true,
  async process() {
    // No money moves upfront with COD, so "paid" would be a lie until the
    // courier actually collects payment on delivery.
    return { success: true, paymentStatus: "pending" }
  },
}

export const manualPaymentPlaceholderProvider: PaymentProvider = {
  id: "manual",
  label: "Other payment methods",
  description: "Chapa, Telebirr, and other providers are coming soon.",
  enabled: false,
  async process() {
    return { success: false, paymentStatus: "failed", error: "This payment method isn't available yet." }
  },
}

export const paymentProviders: PaymentProvider[] = [
  cashOnDeliveryProvider,
  manualPaymentPlaceholderProvider,
]

export function getPaymentProvider(id: string): PaymentProvider | undefined {
  return paymentProviders.find((p) => p.id === id)
}
