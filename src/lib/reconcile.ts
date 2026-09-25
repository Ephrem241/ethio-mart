// The pure part of the sign-in sync (services/guest-sync.ts): laying what the
// shopper changed on THIS device over the server's copy. Kept free of stores
// and network code so it can be tested on its own.

/** What was edited on this device since the server copy was last reconciled (store/edit-tracker.ts). */
export type Edits = { ids: Set<string>; all: boolean }
export type Quantities = Map<string, number>
export interface QuantityLine {
  productId: string
  quantity: number
}

export const toQuantities = (lines: QuantityLine[]): Quantities =>
  new Map(lines.map((line) => [line.productId, line.quantity]))

export const toLines = (quantities: Quantities): QuantityLine[] =>
  [...quantities].map(([productId, quantity]) => ({ productId, quantity }))

// The server's cart (`base`) with the shopper's own edits laid over it: for
// every line they touched, what is on this device wins.
export function reconcileCart(base: Quantities, local: Quantities, edits: Edits) {
  // Emptying the cart touched every line, on both sides.
  const changed = edits.all ? new Set([...local.keys(), ...base.keys()]) : edits.ids
  const merged: Quantities = new Map(edits.all ? [] : base)
  for (const id of changed) {
    const quantity = local.get(id)
    if (quantity === undefined) merged.delete(id)
    else merged.set(id, quantity)
  }
  return { merged, changed }
}

// Same idea for favorites: the server's list with this device's toggles on top.
export function reconcileFavorites(base: string[], local: Set<string>, edits: Edits): Set<string> {
  const merged = new Set(base)
  for (const id of edits.ids) {
    if (local.has(id)) merged.add(id)
    else merged.delete(id)
  }
  return merged
}
