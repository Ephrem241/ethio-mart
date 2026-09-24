import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"

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
export { UUID_RE } from "@/lib/uuid"

function reportSyncFailure(action: string, message: string) {
  console.error(`[cart sync] ${action} failed:`, message)
  toast.error(translate("cart.syncFailed"))
}

// `null` means the load FAILED — not "the cart is empty". The caller keeps
// the local copy then, instead of wiping it because the network hiccuped.
export async function fetchRemoteCart(userId: string): Promise<RemoteCartLine[] | null> {
  const { data, error } = await createClient()
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    reportSyncFailure("load", error.message)
    return null
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
