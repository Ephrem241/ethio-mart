import { createBrowserClient } from "@supabase/ssr"

// Browser client — used by every "use client" component that needs auth
// state, direct Storage uploads, or (rarely) a direct query outside a
// Server Component. Safe to call repeatedly; @supabase/ssr manages a
// singleton internally per browser tab.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
