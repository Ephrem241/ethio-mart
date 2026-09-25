import { translate } from "@/lib/i18n/translate"
import type { MessageKey, MessageParams } from "@/lib/i18n/translator"

// The database raises its own exceptions (place_order, the order-status
// trigger, the newsletter function) in English. They are precise and meant for
// shoppers, but must be shown in the shopper's language — so each known
// message maps to a translated one here. Anything unrecognised (a raw
// Postgres or network error) becomes a generic message instead of leaking
// English technical text into the page.
const KNOWN: { pattern: RegExp; key: MessageKey; params?: (match: RegExpMatchArray) => MessageParams }[] = [
  { pattern: /^You must be signed in/i, key: "errors.signInRequired" },
  { pattern: /^Your cart is empty/i, key: "checkout.errors.cartEmpty" },
  { pattern: /^Invalid quantity/i, key: "errors.invalidQuantity" },
  { pattern: /^Some items in your cart are no longer available/i, key: "checkout.errors.unavailable" },
  {
    pattern: /^Not enough stock for: (.+?)\. Please update/i,
    key: "checkout.errors.insufficientStock",
    params: (m) => ({ names: m[1] }),
  },
  { pattern: /payment method isn't available/i, key: "checkout.errors.paymentUnavailable" },
  { pattern: /^Delivery address is incomplete/i, key: "errors.addressIncomplete" },
  { pattern: /^Delivery is not available/i, key: "errors.deliveryUnavailable" },
  {
    pattern: /^Cannot change status of a (\w+) order/i,
    key: "errors.statusTerminal",
    params: (m) => ({ status: translate(`order.status.${m[1]}` as MessageKey) }),
  },
  { pattern: /^Order is already in this status/i, key: "errors.sameStatus" },
  { pattern: /^Enter a valid email address/i, key: "validation.email" },
  // The request itself never arrived: offline, or the service is unreachable (each browser words it differently).
  { pattern: /fetch failed|failed to fetch|network ?error|network request failed|load failed/i, key: "errors.network" },
]

export function translateDbError(message: string | undefined | null): string {
  const text = message ?? ""
  for (const { pattern, key, params } of KNOWN) {
    const match = text.match(pattern)
    if (match) return translate(key, params?.(match))
  }
  return translate("common.somethingWentWrong")
}
