"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore, useCurrentUser, type AuthUser } from "@/lib/store/auth"

// There is no server-side session to check (no middleware, no Supabase SSR
// client — that's Phase 12), so this is the same client-only, best-effort
// redirect useRequireAuth already is: it stops casual browsing to /admin/*
// while signed out or signed in as a customer, but a determined visitor
// could edit localStorage directly (e.g. flip their own `role` field) and
// get in. This is a PROVISIONAL stand-in for spec Section 58's "authorization
// must happen server-side" — real server-verified protection (middleware +
// Supabase RLS) isn't achievable until Phase 12. Do not treat this as real
// authorization; it does not claim to be.
export function useRequireAdmin(): { user: AuthUser | null; ready: boolean } {
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const user = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!hasHydrated) return
    if (!user) {
      router.replace("/login?redirect=/admin")
      return
    }
    if (user.role !== "admin") {
      router.replace("/")
    }
  }, [hasHydrated, user, router])

  return { user, ready: hasHydrated && !!user && user.role === "admin" }
}
