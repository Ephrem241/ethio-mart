"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore, useCurrentUser, type AuthUser } from "@/lib/store/auth"

// There is no server-side session to check (no middleware, no Supabase SSR
// client — that's Phase 12). This is a client-only, best-effort redirect:
// it protects against casually browsing to a gated page while signed out,
// but a determined visitor could edit localStorage directly. Real
// server-verified protection isn't achievable until Phase 12.
export function useRequireAuth(redirectPath: string): { user: AuthUser | null; ready: boolean } {
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const user = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace(redirectPath)
    }
  }, [hasHydrated, user, router, redirectPath])

  return { user, ready: hasHydrated && !!user }
}
