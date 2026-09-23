import { create } from "zustand"
import { persist } from "zustand/middleware"

import { useAuthStore } from "@/lib/store/auth"
import {
  upsertRemoteCartLine,
  deleteRemoteCartLine,
  clearRemoteCart,
} from "@/lib/services/cart-remote"

export interface CartLine {
  productId: string
  quantity: number
}

interface CartState {
  items: CartLine[]
  // Whose cart this is a mirror of: a signed-in user's id, or null for a
  // guest. This is what makes login-merge safe — without it, a page reload
  // while signed in would look identical to "guest items to merge" and every
  // quantity would double on each reload. See services/guest-sync.ts.
  ownerId: string | null
  // False until `persist` finishes reading localStorage. The /cart page
  // renders nothing until this flips, rather than briefly showing the
  // empty-cart state for a user who actually has a saved cart.
  hasHydrated: boolean
  addItem: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setHasHydrated: (value: boolean) => void
  _replace: (items: CartLine[], ownerId: string | null) => void
}

// Guests: local only (unchanged). Signed in: every change is ALSO written
// through to `cart_items`, fire-and-forget — the local store stays the one
// read model every cart component already uses, so nothing that displays
// the cart had to change.
function mirror(get: () => CartState, run: (userId: string) => Promise<void>) {
  const user = useAuthStore.getState().user
  if (user && get().ownerId === user.id) void run(user.id)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addItem: (productId, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId)
          return existing
            ? {
                items: state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
                ),
              }
            : { items: [...state.items, { productId, quantity }] }
        })
        const line = get().items.find((i) => i.productId === productId)
        if (line) mirror(get, (uid) => upsertRemoteCartLine(uid, productId, line.quantity))
      },
      setQuantity: (productId, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        }))
        if (quantity <= 0) mirror(get, (uid) => deleteRemoteCartLine(uid, productId))
        else mirror(get, (uid) => upsertRemoteCartLine(uid, productId, quantity))
      },
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
        mirror(get, (uid) => deleteRemoteCartLine(uid, productId))
      },
      clearCart: () => {
        set({ items: [] })
        mirror(get, (uid) => clearRemoteCart(uid))
      },
      // Sync-internal: replaces local state WITHOUT writing back to the
      // server (used when the server copy is the thing being loaded).
      _replace: (items, ownerId) => set({ items, ownerId }),
    }),
    {
      name: "ethio-mart-cart",
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)

export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, line) => sum + line.quantity, 0)
}
