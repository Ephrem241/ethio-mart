// Real Supabase Auth. Function signatures match the mock this replaced, so
// the Phase 7-10 call sites did not need to change — with ONE exception,
// stated plainly: password recovery is inherently two steps against a real
// backend (emailed link -> set new password), so the mock's one-shot
// `resetPassword({ email, newPassword })` became requestPasswordReset +
// setNewPassword.
import type { SupabaseClient, User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"
import { useAuthStore, type AuthUser, type Role } from "@/lib/store/auth"

interface ProfileRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  created_at: string
}

// Supabase Auth reports failures as a machine-readable `code` plus English
// text. Known codes get a translated message; anything else becomes a generic
// one rather than leaking raw English into an Amharic page.
function authErrorMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return translate("auth.errors.alreadyExists")
    case "invalid_credentials":
      return translate("auth.errors.invalidCredentials")
    case "weak_password":
      return translate("auth.errors.weakPassword")
    case "same_password":
      return translate("auth.errors.samePassword")
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return translate("auth.errors.tooManyRequests")
    case "email_address_invalid":
    case "validation_failed":
      return translate("validation.email")
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
      // Opening the reset page directly (no emailed link) means there is no
      // recovery session, which the auth server reports as a missing session.
      return translate("auth.reset.invalidLink")
  }
  if (/already registered/i.test(error.message)) return translate("auth.errors.alreadyExists")
  if (/session/i.test(error.message)) return translate("auth.reset.invalidLink")
  return translate("common.somethingWentWrong")
}

function toAuthUser(row: ProfileRow, hasPassword: boolean): AuthUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    createdAt: row.created_at,
    hasPassword,
  }
}

// Supabase lists every way an account can sign in under app_metadata.providers.
function hasPasswordLogin(authUser: User): boolean {
  const providers = (authUser.app_metadata?.providers as string[] | undefined) ?? []
  return providers.includes("email")
}

// Loads the `profiles` row (role, phone, ...) for a signed-in auth user. If
// the row is somehow missing, fall back to the session's own data as a
// customer rather than treating a genuinely signed-in user as signed out.
export async function fetchAuthUser(supabase: SupabaseClient, authUser: User): Promise<AuthUser> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("id", authUser.id)
    .maybeSingle()

  if (data) return toAuthUser(data as ProfileRow, hasPasswordLogin(authUser))

  return {
    id: authUser.id,
    fullName: (authUser.user_metadata?.full_name as string | undefined) ?? "",
    email: authUser.email ?? "",
    role: "customer",
    createdAt: authUser.created_at,
    hasPassword: hasPasswordLogin(authUser),
  }
}

function setSignedInUser(user: AuthUser) {
  const { _setUser, _setHasHydrated } = useAuthStore.getState()
  _setUser(user)
  _setHasHydrated(true)
  // A visitor who was browsing signed out has no session listener yet (see
  // AuthProvider). Start it now: it also merges the guest cart/favorites
  // into the new account.
  void import("@/lib/services/auth-listener").then((m) => m.ensureAuthListener())
}

type AuthResult<T = { user: AuthUser }> =
  | ({ success: true } & T)
  | { success: false; error: string }

export async function signUp(input: {
  fullName: string
  email: string
  password: string
}): Promise<AuthResult> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    // The handle_new_user trigger reads full_name from here to create the
    // profiles row. Role is never accepted from the client — every new
    // account is a customer, and admin status is never self-assignable.
    options: { data: { full_name: input.fullName.trim() } },
  })

  if (error) {
    return { success: false, error: authErrorMessage(error) }
  }

  // No session means the project still requires email confirmation.
  if (!data.user || !data.session) {
    return { success: false, error: translate("auth.errors.confirmEmail") }
  }

  const user = await fetchAuthUser(supabase, data.user)
  setSignedInUser(user)
  return { success: true, user }
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  })

  if (error || !data.user) {
    // Same message whether the email doesn't exist or the password is
    // wrong — a real credential check shouldn't reveal which was incorrect.
    if (!error || error.code === "invalid_credentials") {
      return { success: false, error: translate("auth.errors.invalidCredentials") }
    }
    return { success: false, error: authErrorMessage(error) }
  }

  const user = await fetchAuthUser(supabase, data.user)
  setSignedInUser(user)
  return { success: true, user }
}

// Google sign-in. `success: true` means the redirect to Google has STARTED
// (the page is navigating away — callers should keep showing "loading").
// Coming back, Google -> Supabase -> /auth/callback exchanges the code for a
// session cookie and forwards to `next`; the AuthProvider then picks the
// session up exactly as it does for a password sign-in (so a guest cart is
// merged too).
export async function signInWithGoogle(
  next: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?flow=oauth&next=${encodeURIComponent(next)}`,
    },
  })
  return error ? { success: false, error: authErrorMessage(error) } : { success: true }
}

export async function signOut(): Promise<void> {
  await createClient().auth.signOut()
  useAuthStore.getState()._setUser(null)
}

// Step 1 of recovery. Always reports success for a well-formed request so
// this can't be used to discover which emails have accounts.
export async function requestPasswordReset(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await createClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  })
  if (error) return { success: false, error: authErrorMessage(error) }
  return { success: true }
}

// Step 2 of recovery. Only works inside the short-lived session the emailed
// link establishes (via /auth/callback).
export async function setNewPassword(
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await createClient().auth.updateUser({ password: newPassword })
  if (error) return { success: false, error: authErrorMessage(error) }
  return { success: true }
}

export async function updateProfile(input: {
  userId: string
  fullName: string
  phone: string
}): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName.trim(), phone: input.phone.trim() || null })
    .eq("id", input.userId)
    .select("id, full_name, email, phone, role, created_at")
    .maybeSingle()

  if (error) return { success: false, error: authErrorMessage(error) }
  if (!data) return { success: false, error: translate("auth.errors.accountNotFound") }

  const user = toAuthUser(data as ProfileRow, useAuthStore.getState().user?.hasPassword ?? true)
  useAuthStore.getState()._setUser(user)
  return { success: true, user }
}

// Supabase has no single "verify current password, then change it" call, so:
// re-authenticate with the current password first (also proves the person at
// the keyboard knows it), and only then update.
export async function changePassword(input: {
  userId: string
  currentPassword: string
  newPassword: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const email = useAuthStore.getState().user?.email
  if (!email) return { success: false, error: translate("auth.errors.accountNotFound") }

  const supabase = createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: input.currentPassword,
  })
  if (verifyError) return { success: false, error: translate("auth.errors.wrongCurrent") }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword })
  if (error) return { success: false, error: authErrorMessage(error) }
  return { success: true }
}
