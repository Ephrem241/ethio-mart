import { createClient } from "@/lib/supabase/client"
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
