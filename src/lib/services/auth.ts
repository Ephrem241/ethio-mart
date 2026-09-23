// Real Supabase Auth. Function signatures match the mock this replaced, so
// the Phase 7-10 call sites did not need to change — with ONE exception,
// stated plainly: password recovery is inherently two steps against a real
// backend (emailed link -> set new password), so the mock's one-shot
// `resetPassword({ email, newPassword })` became requestPasswordReset +
// setNewPassword.
import type { SupabaseClient, User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import { useAuthStore, type AuthUser, type Role } from "@/lib/store/auth"

interface ProfileRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  created_at: string
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
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return { success: false, error: "An account with this email already exists." }
    }
    return { success: false, error: error.message }
  }

  // No session means the project still requires email confirmation.
  if (!data.user || !data.session) {
    return { success: false, error: "Check your email to confirm your account, then sign in." }
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
      return { success: false, error: "Invalid email or password." }
    }
    return { success: false, error: error.message }
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
  return error ? { success: false, error: error.message } : { success: true }
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
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Step 2 of recovery. Only works inside the short-lived session the emailed
// link establishes (via /auth/callback).
export async function setNewPassword(
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await createClient().auth.updateUser({ password: newPassword })
  if (error) return { success: false, error: error.message }
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

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: "Account not found." }

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
  if (!email) return { success: false, error: "Account not found." }

  const supabase = createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: input.currentPassword,
  })
  if (verifyError) return { success: false, error: "Current password is incorrect." }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
