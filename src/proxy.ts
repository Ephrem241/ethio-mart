import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  LOCALE_PARAM,
  isLocale,
} from "@/lib/i18n/config"

// Two unrelated jobs share this file because Next allows one proxy:
//  1. Route protection for signed-in areas (authProxy below).
//  2. `?lang=` support for the public pages (localeProxy below).
export async function proxy(request: NextRequest) {
  return isProtectedPath(request.nextUrl.pathname) ? authProxy(request) : localeProxy(request)
}

const PROTECTED = /^\/(account|checkout|orders|order|admin)(\/|$)/

function isProtectedPath(pathname: string): boolean {
  return PROTECTED.test(pathname)
}

// Public pages answer to `?lang=am|en` (the language links crawlers and shared
// URLs rely on — see i18n/config.ts). The parameter becomes a request header
// for the page render, and is remembered in the visitor's cookie so that
// following links keeps the language. An inbound `x-locale` header is dropped
// first so only this function decides it.
function localeProxy(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get(LOCALE_PARAM)
  const headers = new Headers(request.headers)
  headers.delete(LOCALE_HEADER)

  if (!isLocale(requested)) return NextResponse.next({ request: { headers } })

  headers.set(LOCALE_HEADER, requested)
  const response = NextResponse.next({ request: { headers } })
  response.cookies.set(LOCALE_COOKIE, requested, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  })
  return response
}

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
async function authProxy(request: NextRequest) {
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
  matcher: [
    // signed-in areas
    "/account/:path*",
    "/checkout",
    "/orders/:path*",
    "/order/:path*",
    "/admin/:path*",
    // public pages that support `?lang=` (the ones search engines index)
    "/",
    "/shop",
    "/categories",
    "/category/:path*",
    "/product/:path*",
  ],
}
