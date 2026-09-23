import { z } from "zod"

import { ETHIOPIA_PHONE_REGEX, ETHIOPIA_PHONE_MESSAGE } from "@/lib/phone"

// A separate schema from checkout-schema.ts on purpose, even though the
// fields match today: an address book entry and a one-time delivery form
// are different concerns, so a future change to one should never silently
// alter validation for the other.
export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a full name."),
  phone: z.string().trim().regex(ETHIOPIA_PHONE_REGEX, ETHIOPIA_PHONE_MESSAGE),
  city: z.string().min(1, "Select a city."),
  subCity: z.string().trim().min(2, "Enter a sub-city."),
  woreda: z.string().trim().min(1, "Enter a woreda."),
  address: z.string().trim().min(5, "Enter a street address."),
  notes: z.string().trim().max(300, "Keep notes under 300 characters.").optional(),
})

export type AddressValues = z.infer<typeof addressSchema>
