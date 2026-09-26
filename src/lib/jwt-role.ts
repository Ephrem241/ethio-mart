// The `role` claim of a Supabase key. Supabase's keys are JWTs whose payload
// says which database role they act as: "anon" (safe to ship to browsers,
// power limited by row-level security) or "service_role" (bypasses all
// security, must never leave the server). Reading the claim needs no secret —
// the payload is only base64 — so it can be used to check a key for what it
// is, without trusting the name of the variable it was pasted into.
export function jwtRole(token: string): string | null {
  const parts = token.trim().split(".")
  if (parts.length !== 3) return null
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))
    if (typeof payload === "object" && payload !== null && "role" in payload && typeof payload.role === "string") {
      return payload.role
    }
  } catch {
    // not a JWT
  }
  return null
}

// Anything shaped like a JWT, for scanning text (built pages, source files).
export const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g

// Supabase's newer opaque secret keys ("sb_secret_…"); the matching publishable
// keys start "sb_publishable_" and are safe to expose.
export const SECRET_KEY_PATTERN = /sb_secret_[A-Za-z0-9_-]{8,}/g
