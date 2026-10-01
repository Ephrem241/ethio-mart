import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"
import type { Role } from "@/lib/store/auth"

// Minimal view of a profile for admin screens. The list deliberately
// selects only what those screens display — there is nothing sensitive to
// leak because credentials don't live in `profiles` at all (they're inside
// Supabase Auth, unreachable from this API), which is a stronger guarantee
// than the mock's "remember never to render the hash fields".
export interface AdminProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  role: Role
  createdAt: string
}

interface ProfileRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  created_at: string
}

// RLS: an admin may read every profile; anyone else only their own.
export async function fetchProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await createClient()
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to load customers: ${error.message}`) // i18n-ignore: developer-facing
  return (data as ProfileRow[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    createdAt: row.created_at,
  }))
}

// Gives or takes away admin access. The database allows this only for an
// admin (RLS), and silently keeps the old role for anyone else (the
// prevent_role_self_escalation trigger), so the saved role is read back.
export async function setUserRole(id: string, role: Role): Promise<{ success: true } | { success: false; error: string }> {
  const { data, error } = await createClient().from("profiles").update({ role }).eq("id", id).select("role")
  if (error) return { success: false, error: translate("common.somethingWentWrong") }
  if (!data || data.length === 0 || (data[0] as { role: Role }).role !== role) {
    return { success: false, error: translate("errors.notAllowed") }
  }
  return { success: true }
}
