import type { CartLine } from "@/lib/store/cart"
import { isOnSale, type ProductWithCategory } from "@/lib/services/catalog"

export interface ResolvedCartLine {
  line: CartLine
  product: ProductWithCategory
}

// Shared by CartContents and the checkout flow so "what's actually in the
// cart right now" is computed exactly once (Rule 4) — resolving against
// live product data each time, not whatever was true when items were added.
// Pure: pairs each cart line with its live product. `products` comes from
// useProductsByIds (client) or a direct fetch (checkout) — this file no longer
// looks anything up itself. A line whose product is absent (deleted or
// deactivated) is reported as unavailable rather than silently dropped.
export function resolveCartLines(
  items: CartLine[],
  products: ProductWithCategory[]
): {
  resolvedLines: ResolvedCartLine[]
  unavailableLines: CartLine[]
} {
  const byId = new Map(products.map((p) => [p.id, p]))
  const decorated = items.map((line) => ({ line, product: byId.get(line.productId) }))
  const resolvedLines = decorated.filter(
    (entry): entry is ResolvedCartLine => !!entry.product
  )
  const unavailableLines = decorated.filter((entry) => !entry.product).map((entry) => entry.line)
  return { resolvedLines, unavailableLines }
}

export function computeCartTotals(resolvedLines: ResolvedCartLine[]): {
  subtotal: number
  savings: number
} {
  const subtotal = resolvedLines.reduce(
    (sum, { line, product }) => sum + product.price * line.quantity,
    0
  )
  const savings = resolvedLines.reduce((sum, { line, product }) => {
    if (!isOnSale(product)) return sum
    return sum + (product.compare_at_price! - product.price) * line.quantity
  }, 0)
  return { subtotal, savings }
}

// Lines requesting more than is currently in stock — the real,
// authoritative check checkout.ts re-runs at submit time; the checkout
// review section also calls this to warn/disable pre-emptively.
export function getInsufficientStockLines(resolvedLines: ResolvedCartLine[]): ResolvedCartLine[] {
  return resolvedLines.filter(({ line, product }) => line.quantity > product.stock)
}
