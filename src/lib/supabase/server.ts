import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Server client — used from Server Components, Server Actions, and Route
// Handlers. Reads/writes the real session cookie via Next's `cookies()`.
// A Server Component itself can't write cookies (Next throws if you try
// outside a Server Action/Route Handler), so `setAll`'s try/catch below is
// not defensive filler — it's the documented, necessary way to let this
// same factory work from both contexts: middleware.ts refreshes the
// session cookie on every request, so a Server Component silently no-op-ing
// a cookie write here is safe and expected, not a bug.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component — middleware.ts already
            // refreshes the session cookie, so this is safe to ignore.
          }
        },
      },
    }
  )
}
