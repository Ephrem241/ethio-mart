import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

// Raw `cart_items` reads/writes for a SIGNED-IN user. Guests never touch
// this table (checkout already requires login, so an anonymous cart is never
// something the database needs to hold) — their cart lives only in the
// local store until they sign in and it's merged (see guest-sync.ts).

export interface RemoteCartLine {
  productId: string
  quantity: number
}

// Carts saved before this phase keyed lines by the old mock slug-style ids
// ("classic-leather-bag"), which are not valid product UUIDs and would make
// Postgres reject the whole write. Only real ids are ever synced.
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function reportSyncFailure(action: string, message: string) {
  console.error(`[cart sync] ${action} failed:`, message)
  toast.error("Couldn't sync your cart. Your changes are saved on this device.")
}

export async function fetchRemoteCart(userId: string): Promise<RemoteCartLine[]> {
  const { data, error } = await createClient()
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    reportSyncFailure("load", error.message)
    return []
  }
  return (data ?? []).map((row) => ({ productId: row.product_id as string, quantity: row.quantity as number }))
}

export async function upsertRemoteCartLine(userId: string, productId: string, quantity: number) {
  const { error } = await createClient()
    .from("cart_items")
    .upsert({ user_id: userId, product_id: productId, quantity }, { onConflict: "user_id,product_id" })
  if (error) reportSyncFailure("save", error.message)
}

export async function deleteRemoteCartLine(userId: string, productId: string) {
  const { error } = await createClient()
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId)
  if (error) reportSyncFailure("remove", error.message)
}

export async function clearRemoteCart(userId: string) {
  const { error } = await createClient().from("cart_items").delete().eq("user_id", userId)
  if (error) reportSyncFailure("clear", error.message)
}
