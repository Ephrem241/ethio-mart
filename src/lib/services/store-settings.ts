import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

// Server-side read of shop-wide settings (`store_settings`, public read).
//
// The free-delivery threshold is the one the database applies when it prices
// an order (place_order, 0014). The storefront advertises it ONLY when it is
// set, so the banner can never promise something checkout doesn't do. `null`
// means "no free-delivery offer".
export const getFreeDeliveryThreshold = cache(async (): Promise<number | null> => {
  const { data, error } = await (await createClient())
    .from("store_settings")
    .select("value")
    .eq("key", "free_delivery_threshold")
    .maybeSingle()

  if (error) {
    // Never take the whole page down for a banner; just don't advertise.
    console.error("Failed to load store settings:", error.message) // i18n-ignore: developer-facing
    return null
  }
  const value = data?.value
  return typeof value === "number" && value > 0 ? value : null
})
