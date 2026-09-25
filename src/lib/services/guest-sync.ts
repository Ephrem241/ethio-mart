import { useCartStore, cartEdits } from "@/lib/store/cart"
import { useFavoritesStore, favoriteEdits } from "@/lib/store/favorites"
import { UUID_RE } from "@/lib/uuid"
import {
  reconcileCart,
  reconcileFavorites,
  toLines,
  toQuantities,
  type Edits,
  type Quantities,
} from "@/lib/reconcile"
import {
  fetchRemoteCart,
  upsertRemoteCartLine,
  deleteRemoteCartLine,
} from "@/lib/services/cart-remote"
import {
  fetchRemoteFavorites,
  addRemoteFavorites,
  removeRemoteFavorite,
} from "@/lib/services/favorites-remote"

// Runs when a signed-in user is first seen (fresh sign-in OR a page load
// with an existing session). Three cases, decided by the local store's
// `ownerId`:
//  - ownerId === this user: the local copy is just a mirror of the server
//    (write-through) -> the SERVER wins; reload it (also picks up changes
//    made on another device) — except for whatever the shopper changed on
//    this device meanwhile (see store/edit-tracker.ts), which is kept and sent
//    to the server again.
//  - ownerId === null: a GUEST cart/list -> merge it into the server copy
//    (spec: guests can shop; nothing they added is lost by signing in).
//  - ownerId === some other user: leftover from a different account -> never
//    merged into this one; discarded in favor of this user's server data.
//
// Two rules keep a slow or failing network from costing the shopper anything:
//  - The local copy is read AFTER the server has answered, and the local store
//    is updated in the same tick (nothing awaited in between), so an edit made
//    while the server copy was loading is merged in, never overwritten.
//  - A failed load (`null`) leaves the local copy exactly as it is; it is
//    retried on the next page load.

// The persisted stores hydrate from localStorage independently of auth. If
// the sync ran first it would see an empty "guest" cart and a saved guest
// cart would be silently dropped instead of merged.
function whenHydrated(store: {
  getState: () => { hasHydrated: boolean }
  subscribe: (listener: (state: { hasHydrated: boolean }) => void) => () => void
}): Promise<void> {
  return new Promise((resolve) => {
    if (store.getState().hasHydrated) {
      resolve()
      return
    }
    const unsubscribe = store.subscribe((state) => {
      if (state.hasHydrated) {
        unsubscribe()
        resolve()
      }
    })
  })
}

// The server may have missed those edits (nothing is sent before the session
// is known) or seen them out of order, so send them again. Quantities are
// absolute, so repeating one is harmless.
function sendCartEdits(userId: string, changed: Set<string>, local: Quantities) {
  return Promise.all(
    [...changed].map((id) =>
      local.has(id) ? upsertRemoteCartLine(userId, id, local.get(id)!) : deleteRemoteCartLine(userId, id)
    )
  )
}

async function syncCart(userId: string) {
  await whenHydrated(useCartStore)
  const remote = await fetchRemoteCart(userId)
  if (remote === null) return

  // From here to the `_replace` there is no `await`.
  const cart = useCartStore.getState()
  const edits = cartEdits.drain()
  const server = toQuantities(remote)

  if (cart.ownerId === userId) {
    const local = toQuantities(cart.items)
    const { merged, changed } = reconcileCart(server, local, edits)
    cart._replace(toLines(merged), userId)
    await sendCartEdits(userId, changed, local)
    return
  }

  const guestLines =
    cart.ownerId === null ? cart.items.filter((line) => UUID_RE.test(line.productId)) : []

  const merged: Quantities = new Map(server)
  for (const line of guestLines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity)
  }

  // The guest lines reach the server BEFORE this device starts treating its
  // copy as a mirror, so closing the page right now can't lose them (the next
  // load merges again).
  await Promise.all(guestLines.map((line) => upsertRemoteCartLine(userId, line.productId, merged.get(line.productId)!)))

  // Whatever the shopper changed while that was in flight wins over the merge.
  const now = useCartStore.getState()
  const during = cartEdits.drain()
  const local = toQuantities(now.items)
  const result = reconcileCart(merged, local, during)
  now._replace(toLines(result.merged), userId)
  await sendCartEdits(userId, result.changed, local)
}

function sendFavoriteEdits(userId: string, edits: Edits, local: Set<string>) {
  const added = [...edits.ids].filter((id) => local.has(id))
  const removed = [...edits.ids].filter((id) => !local.has(id))
  return Promise.all([addRemoteFavorites(userId, added), ...removed.map((id) => removeRemoteFavorite(userId, id))])
}

async function syncFavorites(userId: string) {
  await whenHydrated(useFavoritesStore)
  const remote = await fetchRemoteFavorites(userId)
  if (remote === null) return

  // From here to the `_replace` there is no `await`.
  const favorites = useFavoritesStore.getState()
  const edits = favoriteEdits.drain()

  if (favorites.ownerId === userId) {
    const local = new Set(favorites.ids)
    favorites._replace([...reconcileFavorites(remote, local, edits)], userId)
    await sendFavoriteEdits(userId, edits, local)
    return
  }

  const guestIds =
    favorites.ownerId === null ? favorites.ids.filter((id) => UUID_RE.test(id)) : []
  const toAdd = guestIds.filter((id) => !remote.includes(id))
  const merged = [...remote, ...toAdd]

  // As with the cart: the guest favorites reach the server first.
  await addRemoteFavorites(userId, toAdd)

  const now = useFavoritesStore.getState()
  const during = favoriteEdits.drain()
  const local = new Set(now.ids)
  now._replace([...reconcileFavorites(merged, local, during)], userId)
  await sendFavoriteEdits(userId, during, local)
}

export async function syncGuestDataOnLogin(userId: string) {
  await Promise.all([syncCart(userId), syncFavorites(userId)])
}

// A signed-out browser must never keep the previous person's cart or
// favorites (shared computer), and must go back to being a guest.
export function clearLocalUserData() {
  cartEdits.drain()
  favoriteEdits.drain()
  useCartStore.getState()._replace([], null)
  useFavoritesStore.getState()._replace([], null)
}
