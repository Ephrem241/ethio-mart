"use client"

import { useEffect } from "react"

import { useAuthStore } from "@/lib/store/auth"

// Supabase keeps the session in a cookie called sb-<project>-auth-token (long
// sessions are split into .0/.1 pieces). It is readable by script.
const SESSION_COOKIE = /(?:^|;\s*)sb-[^=;]*-auth-token/

// Mounted once in the root layout; renders nothing.
//
// A visitor with no session cookie is signed out — there is nothing to read,
// so the (large) Supabase client is not loaded at all and the page stays
// light. With a session cookie, the listener that keeps the auth store in
// step with the real session is loaded and started. Signing in or registering
// starts the same listener (services/auth.ts).
function AuthProvider() {
  useEffect(() => {
    if (!SESSION_COOKIE.test(document.cookie)) {
      useAuthStore.getState()._setHasHydrated(true)
      return
    }
    void import("@/lib/services/auth-listener").then((m) => m.ensureAuthListener())
  }, [])

  return null
}

export { AuthProvider }
