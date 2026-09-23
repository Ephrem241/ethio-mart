import { create } from "zustand"

// A client-side CACHE of the signed-in user, not a user database. The real
// session lives in Supabase Auth (an httpOnly-style cookie the server proxy
// verifies); this store just mirrors "who is signed in right now" so React
// components can read it synchronously. It is populated by AuthProvider
// (components/providers/auth-provider.tsx) from the real session and its
// `profiles` row — never written to by components directly.
//
// Nothing here is persisted: the cookie is the source of truth, so a stale
// localStorage copy can never claim someone is signed in (or an admin) when
// the server session says otherwise.

export type Role = "customer" | "admin"

export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone?: string
  role: Role
  createdAt: string
  // False for an account that only ever signed in with Google: it has no
  // password, so "change password" (which verifies the current one) doesn't
  // apply to it.
  hasPassword: boolean
}

interface AuthState {
  user: AuthUser | null
  // False until the FIRST session check finishes. Protected pages render
  // nothing until this flips, so a signed-in user never flashes a redirect
  // before their session has even been read.
  hasHydrated: boolean
  _setUser: (user: AuthUser | null) => void
  _setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  hasHydrated: false,
  _setUser: (user) => set({ user }),
  _setHasHydrated: (value) => set({ hasHydrated: value }),
}))

// Returns the stored object itself (a stable reference until the user
// actually changes), so no useMemo is needed — unlike the old mock store,
// which had to derive this object from a users array on every read.
export function useCurrentUser(): AuthUser | null {
  return useAuthStore((s) => s.user)
}
