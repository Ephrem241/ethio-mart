import { useCartStore } from "@/lib/store/cart"
import { useFavoritesStore } from "@/lib/store/favorites"
import {
  UUID_RE,
  fetchRemoteCart,
  upsertRemoteCartLine,
  type RemoteCartLine,
} from "@/lib/services/cart-remote"
import { fetchRemoteFavorites, addRemoteFavorites } from "@/lib/services/favorites-remote"

// Runs when a signed-in user is first seen (fresh sign-in OR a page load
// with an existing session). Three cases, decided by the local store's
// `ownerId`:
//  - ownerId === this user: the local copy is just a mirror of the server
//    (write-through) -> the SERVER wins; reload it (also picks up changes
//    made on another device).
//  - ownerId === null: a GUEST cart/list -> merge it into the server copy
//    (spec: guests can shop; nothing they added is lost by signing in).
//  - ownerId === some other user: leftover from a different account -> never
//    merged into this one; discarded in favor of this user's server data.

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

async function syncCart(userId: string) {
  await whenHydrated(useCartStore)
  const cart = useCartStore.getState()
  const remote = await fetchRemoteCart(userId)

  if (cart.ownerId === userId) {
    cart._replace(remote, userId)
    return
  }

  const guestLines =
    cart.ownerId === null ? cart.items.filter((line) => UUID_RE.test(line.productId)) : []

  const merged = new Map<string, number>(remote.map((line) => [line.productId, line.quantity]))
  for (const line of guestLines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity)
  }

  await Promise.all(guestLines.map((line) => upsertRemoteCartLine(userId, line.productId, merged.get(line.productId)!)))

  const mergedLines: RemoteCartLine[] = [...merged].map(([productId, quantity]) => ({ productId, quantity }))
  useCartStore.getState()._replace(mergedLines, userId)
}

async function syncFavorites(userId: string) {
  await whenHydrated(useFavoritesStore)
  const favorites = useFavoritesStore.getState()
  const remote = await fetchRemoteFavorites(userId)

  if (favorites.ownerId === userId) {
    favorites._replace(remote, userId)
    return
  }

  const guestIds =
    favorites.ownerId === null ? favorites.ids.filter((id) => UUID_RE.test(id)) : []
  const toAdd = guestIds.filter((id) => !remote.includes(id))

  await addRemoteFavorites(userId, toAdd)
  useFavoritesStore.getState()._replace([...remote, ...toAdd], userId)
}

export async function syncGuestDataOnLogin(userId: string) {
  await Promise.all([syncCart(userId), syncFavorites(userId)])
}

// A signed-out browser must never keep the previous person's cart or
// favorites (shared computer), and must go back to being a guest.
export function clearLocalUserData() {
  useCartStore.getState()._replace([], null)
  useFavoritesStore.getState()._replace([], null)
}
