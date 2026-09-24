import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

// What the information pages (contact, delivery, returns, FAQ) need from the
// database, read on the server. Everything here is public by design: the
// `store_settings` and `delivery_fees` tables are readable by anyone (RLS), and
// the pages show only what has actually been set — nothing is invented.
//
// `store_settings` keys used here (JSON values; set them in the Supabase
// dashboard until an admin screen exists):
//   contact_email, contact_phone, contact_address, support_hours  -> text
//   return_window_days                                            -> number

async function readSettings(keys: string[]): Promise<Map<string, unknown>> {
  const { data, error } = await (await createClient()).from("store_settings").select("key, value").in("key", keys)
  if (error) {
    // An information page must still render if the lookup fails.
    console.error("Failed to load store settings:", error.message) // i18n-ignore: developer-facing
    return new Map()
  }
  return new Map((data ?? []).map((row) => [row.key as string, row.value as unknown]))
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, 200) : null
}

export interface StoreContact {
  email: string | null
  phone: string | null
  address: string | null
  hours: string | null
}

// Each field is null until the shop has set it; the contact page shows only the
// ones that exist.
export const getStoreContact = cache(async (): Promise<StoreContact> => {
  const settings = await readSettings(["contact_email", "contact_phone", "contact_address", "support_hours"])
  return {
    email: text(settings.get("contact_email")),
    phone: text(settings.get("contact_phone")),
    address: text(settings.get("contact_address")),
    hours: text(settings.get("support_hours")),
  }
})

// How many days after delivery a return may be requested; null = the shop has
// not set a window, so no number is promised.
export const getReturnWindowDays = cache(async (): Promise<number | null> => {
  const value = (await readSettings(["return_window_days"])).get("return_window_days")
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 365 ? value : null
})

export interface DeliveryFeeRow {
  city: string
  fee: number
}

// The fee for each city, cheapest first; the "Other" row is the fee for every
// city not listed by name.
export const getDeliveryFees = cache(async (): Promise<DeliveryFeeRow[]> => {
  const { data, error } = await (await createClient()).from("delivery_fees").select("city, fee")
  if (error) {
    console.error("Failed to load delivery fees:", error.message) // i18n-ignore: developer-facing
    return []
  }
  return (data ?? [])
    .map((row) => ({ city: row.city as string, fee: Number(row.fee) }))
    .sort((a, b) => (a.city === "Other" ? 1 : b.city === "Other" ? -1 : a.fee - b.fee || a.city.localeCompare(b.city)))
})
