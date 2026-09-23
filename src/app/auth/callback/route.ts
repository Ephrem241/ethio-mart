import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getSafeRedirect } from "@/lib/safe-redirect"

// Landing point for every emailed/OAuth link that has to turn into a real
// session (cookies set server-side), then forwards to `next`.
//
// Shapes accepted:
//  - `?code=`  Google sign-in (`flow=oauth`) and Supabase's DEFAULT
//    password-recovery email (PKCE). The code can only be exchanged in the
//    SAME browser that started the flow, because that browser holds the
//    matching code verifier — natural for Google sign-in, but it means a
//    default-template reset link opened on a phone after requesting it on a
//    laptop fails.
//  - `?token_hash=&type=recovery`  works from any browser or device. To use
//    it, point the "Reset Password" email template at
//    {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
//    (a dashboard setting, not something code can change).
//
// On failure the user lands somewhere they can retry: /login for a Google
// attempt (denied consent, provider error), /forgot-password for a reset link.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const isOAuth = searchParams.get("flow") === "oauth"
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

  // A denied Google consent screen arrives here with `?error=access_denied`
  // and no code, so it lands in this same failure path.
  return NextResponse.redirect(
    new URL(isOAuth ? "/login?error=oauth" : "/forgot-password?error=expired", origin)
  )
}
