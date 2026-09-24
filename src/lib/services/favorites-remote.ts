import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"

// Raw `favorites` reads/writes for a SIGNED-IN user (guests keep favorites
// locally — spec Section 25 — and they're merged in on sign-in, see
// guest-sync.ts).

function reportSyncFailure(action: string, message: string) {
  console.error(`[favorites sync] ${action} failed:`, message)
  toast.error(translate("account.favorites.syncFailed"))
}

// `null` means the load FAILED — not "there are no favorites". The caller keeps
// the local copy then, instead of wiping it because the network hiccuped.
export async function fetchRemoteFavorites(userId: string): Promise<string[] | null> {
  const { data, error } = await createClient()
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    reportSyncFailure("load", error.message)
    return null
  }
  return (data ?? []).map((row) => row.product_id as string)
}

export async function addRemoteFavorites(userId: string, productIds: string[]) {
  if (productIds.length === 0) return
  const { error } = await createClient()
    .from("favorites")
    .upsert(
      productIds.map((product_id) => ({ user_id: userId, product_id })),
      { onConflict: "user_id,product_id", ignoreDuplicates: true }
    )
  if (error) reportSyncFailure("save", error.message)
}

export async function removeRemoteFavorite(userId: string, productId: string) {
  const { error } = await createClient()
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId)
  if (error) reportSyncFailure("remove", error.message)
}
