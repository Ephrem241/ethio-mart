import { createClient } from "@/lib/supabase/client"
import { nameOf } from "@/lib/i18n/content"
import { translateDbError } from "@/lib/i18n/db-errors"
import { translate, getActiveLocale } from "@/lib/i18n/translate"
import { useCartStore } from "@/lib/store/cart"
import { resolveCartLines, computeCartTotals, getInsufficientStockLines } from "@/lib/cart-math"
import { fetchProductsByIds } from "@/lib/services/catalog-client"
import { getDeliveryFee } from "@/lib/services/delivery"
import { getPaymentProvider } from "@/lib/services/payment"
import { toOrderRecord } from "@/lib/services/orders"
import type { OrderDeliveryAddress, OrderRecord, PaymentMethodId } from "@/lib/types/orders"

export interface PlaceOrderInput {
  deliveryAddress: OrderDeliveryAddress
  paymentMethod: PaymentMethodId
}

export type PlaceOrderResult =
  | { success: true; order: OrderRecord }
  | { success: false; error: string }

// "Prevent invalid orders" / "verify inventory before creating order" made
// real, in two layers:
//  1. A fast pre-check here against LIVE product data, so the shopper gets a
//     friendly message without a failed round trip.
//  2. The AUTHORITATIVE check inside the database's place_order function,
//     which locks the product rows, re-validates stock, prices every line
//     and the delivery fee itself, sets the payment status, decrements stock
//     and writes the order — all in one transaction. Nothing the browser
//     sends can change what is charged. (A stock shortfall hard-rejects the
//     whole order rather than silently clamping quantities: changing what
//     someone pays without asking them to re-confirm is worse than making
//     them decide.)
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const items = useCartStore.getState().items
  if (items.length === 0) {
    return { success: false, error: translate("checkout.errors.cartEmpty") }
  }

  const products = await fetchProductsByIds(items.map((line) => line.productId))
  const { resolvedLines, unavailableLines } = resolveCartLines(items, products)
  if (unavailableLines.length > 0) {
    return { success: false, error: translate("checkout.errors.unavailable") }
  }

  const insufficientStock = getInsufficientStockLines(resolvedLines)
  if (insufficientStock.length > 0) {
    const locale = getActiveLocale()
    const names = insufficientStock.map(({ product }) => nameOf(product, locale)).join(", ")
    return { success: false, error: translate("checkout.errors.insufficientStock", { names }) }
  }

  const provider = getPaymentProvider(input.paymentMethod)
  if (!provider || !provider.enabled) {
    return { success: false, error: translate("checkout.errors.invalidPayment") }
  }

  // Estimate only — used for the provider hand-off; the database computes
  // the real total.
  const { subtotal } = computeCartTotals(resolvedLines)
  const estimatedTotal = subtotal + (await getDeliveryFee(input.deliveryAddress.city, subtotal))

  const paymentResult = await provider.process({ total: estimatedTotal })
  if (!paymentResult.success) {
    return { success: false, error: paymentResult.error ?? translate("checkout.errors.paymentFailed") }
  }

  const { data, error } = await createClient().rpc("place_order", {
    p_delivery_address: input.deliveryAddress,
    p_payment_method: input.paymentMethod,
    p_items: resolvedLines.map(({ line }) => ({ product_id: line.productId, quantity: line.quantity })),
  })

  if (error) {
    // The function's own exception text (out of stock, unavailable item...)
    // is written for the shopper, in English; translateDbError shows the
    // translated equivalent.
    return { success: false, error: translateDbError(error.message) }
  }

  // The RPC returns the bare order row; fetch its line items for the result.
  const orderRow = data as Omit<OrderRecord, "items">
  const { data: itemRows } = await createClient()
    .from("order_items")
    .select("*")
    .eq("order_id", orderRow.id)

  const order = toOrderRecord({ ...orderRow, order_items: itemRows ?? [] })

  useCartStore.getState().clearCart()
  return { success: true, order }
}
