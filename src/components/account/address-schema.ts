import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"
import { ETHIOPIA_PHONE_REGEX } from "@/lib/phone"

// A separate schema from checkout-schema.ts on purpose, even though the
// fields match today: an address book entry and a one-time delivery form
// are different concerns, so a future change to one should never silently
// alter validation for the other.
export const addressSchema = z.object({
  fullName: z.string().trim().min(2, { error: () => translate("account.addresses.validation.fullName") }),
  phone: z.string().trim().regex(ETHIOPIA_PHONE_REGEX, { error: () => translate("validation.phone") }),
  city: z.string().min(1, { error: () => translate("account.addresses.validation.city") }),
  subCity: z.string().trim().min(2, { error: () => translate("account.addresses.validation.subCity") }),
  woreda: z.string().trim().min(1, { error: () => translate("account.addresses.validation.woreda") }),
  address: z.string().trim().min(5, { error: () => translate("account.addresses.validation.address") }),
  notes: z.string().trim().max(300, { error: () => translate("account.addresses.validation.notes") }).optional(),
})

export type AddressValues = z.infer<typeof addressSchema>
