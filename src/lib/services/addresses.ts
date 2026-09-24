import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"

// The signed-in user's address book (`addresses` table). RLS limits every
// query here to the caller's own rows. The default-address rules (first
// address becomes the default; deleting the default promotes the next one;
// at most one default per user) are enforced by database triggers and a
// partial unique index, so no call site has to remember them.

export interface AddressRecord {
  id: string
  user_id: string
  full_name: string
  phone: string
  city: string
  sub_city: string
  woreda: string
  address: string
  notes?: string
  is_default: boolean
}

export type AddressInput = Omit<AddressRecord, "id" | "user_id" | "is_default">

type Result = { success: true } | { success: false; error: string }

interface AddressRow extends Omit<AddressRecord, "notes"> {
  notes: string | null
}

const COLUMNS = "id, user_id, full_name, phone, city, sub_city, woreda, address, notes, is_default"

function toRecord(row: AddressRow): AddressRecord {
  return { ...row, notes: row.notes ?? undefined }
}

function toRow(input: AddressInput) {
  return { ...input, notes: input.notes?.trim() || null }
}

export async function fetchMyAddresses(userId: string): Promise<AddressRecord[]> {
  const { data, error } = await createClient()
    .from("addresses")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Failed to load addresses: ${error.message}`) // i18n-ignore: developer-facing
  return (data as AddressRow[]).map(toRecord)
}

export async function addAddress(userId: string, input: AddressInput): Promise<Result> {
  const { error } = await createClient()
    .from("addresses")
    .insert({ ...toRow(input), user_id: userId })
  return error ? { success: false, error: translate("common.somethingWentWrong") } : { success: true }
}

export async function updateAddress(id: string, input: AddressInput): Promise<Result> {
  // .select() so a row RLS refused to touch (0 rows) isn't reported as success.
  const { data, error } = await createClient()
    .from("addresses")
    .update(toRow(input))
    .eq("id", id)
    .select("id")

  if (error) return { success: false, error: translate("common.somethingWentWrong") }
  if (!data || data.length === 0) return { success: false, error: translate("account.addresses.notFound") }
  return { success: true }
}

export async function removeAddress(id: string): Promise<Result> {
  const { data, error } = await createClient().from("addresses").delete().eq("id", id).select("id")

  if (error) return { success: false, error: translate("common.somethingWentWrong") }
  if (!data || data.length === 0) return { success: false, error: translate("account.addresses.notFound") }
  return { success: true }
}

// Atomic in the database: clears the old default and sets the new one.
export async function setDefaultAddress(id: string): Promise<Result> {
  const { error } = await createClient().rpc("set_default_address", { p_address_id: id })
  return error ? { success: false, error: translate("common.somethingWentWrong") } : { success: true }
}
