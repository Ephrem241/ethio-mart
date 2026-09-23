import { createClient } from "@/lib/supabase/client"

// Delivery fees live in the `delivery_fees` table — the server's own
// checkout function (place_order) reads the SAME rows to price the order, so
// what the checkout page previews and what is actually charged cannot
// disagree (Section 56: not hardcoded across the frontend). This lookup is
// only the PREVIEW; the authoritative fee is applied in the database.
// There is still no admin screen for editing fees (never built); until then
// they are changed in the Supabase dashboard.

// Options for the City <select> in checkout and the address book. A city
// here without a matching row simply falls back to the 'Other' fee, same as
// the database does.
export const DELIVERY_CITIES = [
  "Addis Ababa",
  "Adama",
  "Bahir Dar",
  "Hawassa",
  "Dire Dawa",
  "Mekelle",
  "Gondar",
  "Jimma",
  "Other",
]

const FALLBACK_CITY = "Other"

let feeCache: Promise<Map<string, number>> | undefined

function loadFees(): Promise<Map<string, number>> {
  // Fees change rarely; one fetch per page load is plenty. A failed load is
  // not cached, so the next lookup retries.
  feeCache ??= (async () => {
    const { data, error } = await createClient().from("delivery_fees").select("city, fee")
    if (error) throw new Error(`Failed to load delivery fees: ${error.message}`)
    return new Map((data ?? []).map((row) => [row.city as string, Number(row.fee)]))
  })().catch((error) => {
    feeCache = undefined
    throw error
  })
  return feeCache
}

export async function getDeliveryFee(city: string): Promise<number> {
  const fees = await loadFees()
  return fees.get(city) ?? fees.get(FALLBACK_CITY) ?? 0
}
