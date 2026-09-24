import { create } from "zustand"
import { persist } from "zustand/middleware"

import { useAuthStore } from "@/lib/store/auth"
import { createEditTracker } from "@/lib/store/edit-tracker"

// What the shopper toggled here since the server copy was last reconciled; the
// sign-in sync merges it over the server's snapshot (see edit-tracker.ts).
export const favoriteEdits = createEditTracker()

interface FavoritesState {
  ids: string[]
  // Same purpose as CartState.ownerId — whose favorites this mirrors
  // (null = guest), so login-merge never re-merges an already-synced list.
  ownerId: string | null
  hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
  toggle: (id: string) => void
  _replace: (ids: string[], ownerId: string | null) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      ownerId: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      toggle: (id) => {
        favoriteEdits.record(id)
        const wasFavorited = get().ids.includes(id)
        set((state) => ({
          ids: wasFavorited ? state.ids.filter((x) => x !== id) : [...state.ids, id],
        }))

        // Signed in: also write through to the `favorites` table. The remote
        // module (and the Supabase client behind it) is loaded on this first
        // write rather than with every page.
        const user = useAuthStore.getState().user
        if (user && get().ownerId === user.id) {
          void import("@/lib/services/favorites-remote").then((remote) => {
            if (wasFavorited) void remote.removeRemoteFavorite(user.id, id)
            else void remote.addRemoteFavorites(user.id, [id])
          })
        }
      },
      _replace: (ids, ownerId) => set({ ids, ownerId }),
    }),
    {
      name: "ethio-mart-favorites",
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)
