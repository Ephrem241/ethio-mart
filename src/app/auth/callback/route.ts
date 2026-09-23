import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getSafeRedirect } from "@/lib/safe-redirect"

// Landing point for the emailed password-recovery link. Establishes a real
// session (cookies set server-side), then sends the user to `next` (the
// set-new-password page). An invalid or expired link falls back to
// /forgot-password so the user can request a fresh one.
//
// Two link shapes are accepted:
//  - `?code=`: what Supabase's DEFAULT email template produces (PKCE). The
//    code can only be exchanged in the SAME browser that requested the
//    reset, because that browser holds the matching code verifier — so a
//    link opened on a phone after requesting it on a laptop fails.
//  - `?token_hash=&type=recovery`: works from any browser or device. To use
//    it, point the "Reset Password" email template at
//    {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
//    (a dashboard setting, not something code can change).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = getSafeRedirect(searchParams.get("next") ?? undefined, "/")

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  } else if (tokenHash && type === "recovery") {
    // Only recovery: this endpoint must not become a general "sign in with
    // any OTP type" door.
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  return NextResponse.redirect(new URL("/forgot-password?error=expired", origin))
}
