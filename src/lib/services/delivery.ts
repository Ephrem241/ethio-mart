import { createClient } from "@/lib/supabase/client"

// Delivery fees live in the `delivery_fees` table — the server's own
// checkout function (place_order) reads the SAME rows to price the order, so
// what the checkout page previews and what is actually charged cannot
// disagree (Section 56: not hardcoded across the frontend). This lookup is
// only the PREVIEW; the authoritative fee is applied in the database.
// There is still no admin screen for editing fees (never built); until then
// they are changed in the Supabase dashboard.

// The city list and its translated labels moved to services/cities.ts (pure, so
// server pages can use them); re-exported here so existing imports keep working.
export { DELIVERY_CITIES, cityLabel, deliveryCityOptions } from "@/lib/services/cities"

const FALLBACK_CITY = "Other"

let feeCache: Promise<Map<string, number>> | undefined

function loadFees(): Promise<Map<string, number>> {
  // Fees change rarely; one fetch per page load is plenty. A failed load is
  // not cached, so the next lookup retries.
  feeCache ??= (async () => {
    const { data, error } = await createClient().from("delivery_fees").select("city, fee")
    if (error) throw new Error(`Failed to load delivery fees: ${error.message}`) // i18n-ignore: developer-facing
    return new Map((data ?? []).map((row) => [row.city as string, Number(row.fee)]))
  })().catch((error) => {
    feeCache = undefined
    throw error
  })
  return feeCache
}

// Orders whose subtotal is strictly ABOVE this ship free (`store_settings`,
// 0014). null = no free-delivery offer. The storefront banner reads the same
// row on the server (store-settings.ts), so what is advertised is what is set.
let thresholdCache: Promise<number | null> | undefined

export function getFreeDeliveryThreshold(): Promise<number | null> {
  thresholdCache ??= (async () => {
    const { data, error } = await createClient()
      .from("store_settings")
      .select("value")
      .eq("key", "free_delivery_threshold")
      .maybeSingle()
    if (error) throw new Error(`Failed to load delivery settings: ${error.message}`) // i18n-ignore: developer-facing
    const value = data?.value
    return typeof value === "number" && value > 0 ? value : null
  })().catch((error) => {
    thresholdCache = undefined
    throw error
  })
  return thresholdCache
}

// `subtotal` is optional so callers that only want the city's base fee keep
// working; when given, the free-delivery rule is applied exactly as
// place_order applies it.
export async function getDeliveryFee(city: string, subtotal?: number): Promise<number> {
  const [fees, threshold] = await Promise.all([loadFees(), getFreeDeliveryThreshold()])
  if (subtotal != null && threshold != null && subtotal > threshold) return 0
  return fees.get(city) ?? fees.get(FALLBACK_CITY) ?? 0
}
