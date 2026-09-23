import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Real, server-side route protection (spec Section 58) — this replaces the
// client-only, best-effort redirects the mock-auth phases had to settle for.
// Runs on the server before any protected page renders, so an unauthorized
// visitor never receives the page's markup at all (verify with curl, not
// just by clicking through the UI).
//
// Layers, honestly described:
//  - This proxy: redirects signed-out visitors, and non-admins away from
//    /admin/*. Cheap by design — the session is verified from the signed JWT
//    cookie (getClaims), not a round trip to the auth server.
//  - Postgres RLS: the AUTHORITATIVE check. Every admin read/write is refused
//    by the database itself unless is_admin() — so even a request that
//    somehow got past this proxy cannot read or change admin data.
//  - Client hooks (use-require-auth / use-require-admin): a live watchdog for
//    a session that ends while a protected page is already open.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Carry any refreshed session cookies onto a redirect response too,
  // otherwise a token refresh that happened during this request is lost.
  function redirectTo(url: URL) {
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  const { pathname, search } = request.nextUrl
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", `${pathname}${search}`)
    return redirectTo(loginUrl)
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // One primary-key lookup, only for /admin/* (a handful of requests from
    // a handful of people) — the JWT carries no role claim to check instead.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single()
    if (profile?.role !== "admin") {
      return redirectTo(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/account/:path*", "/checkout", "/orders/:path*", "/order/:path*", "/admin/:path*"],
}
