"use client"

import { useEffect } from "react"

import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store/auth"
import { fetchAuthUser } from "@/lib/services/auth"
import { syncGuestDataOnLogin, clearLocalUserData } from "@/lib/services/guest-sync"

// Mounted once in the root layout. Turns the REAL Supabase session (cookie)
// into the client-side auth store every component reads, and reacts when it
// changes — sign-in, sign-out, token refresh, another tab, session expiry.
// Renders nothing.
function AuthProvider() {
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let syncedUserId: string | null = null

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Never await other Supabase calls directly inside this callback — the
      // client holds an internal lock while it runs, and a query made from
      // inside it can deadlock. Deferring by a tick is the documented fix.
      setTimeout(async () => {
        const { _setUser, _setHasHydrated } = useAuthStore.getState()

        if (!session) {
          if (event === "SIGNED_OUT") {
            syncedUserId = null
            clearLocalUserData()
          }
          _setUser(null)
          _setHasHydrated(true)
          return
        }

        const user = await fetchAuthUser(supabase, session.user)
        if (cancelled) return
        _setUser(user)
        _setHasHydrated(true)

        // Supabase can re-emit SIGNED_IN for the same person (e.g. tab
        // refocus); only sync when the signed-in user actually changes.
        if (syncedUserId !== user.id) {
          syncedUserId = user.id
          await syncGuestDataOnLogin(user.id)
        }
      }, 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return null
}

export { AuthProvider }
