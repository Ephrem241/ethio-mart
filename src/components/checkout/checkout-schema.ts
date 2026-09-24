import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"
import { ETHIOPIA_PHONE_REGEX } from "@/lib/phone"

// Messages are functions so they are looked up when validation runs, in the
// language the page is showing at that moment.
export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, { error: () => translate("checkout.validation.fullName") }),
  phone: z.string().trim().regex(ETHIOPIA_PHONE_REGEX, { error: () => translate("validation.phone") }),
  city: z.string().min(1, { error: () => translate("checkout.validation.city") }),
  subCity: z.string().trim().min(2, { error: () => translate("checkout.validation.subCity") }),
  woreda: z.string().trim().min(1, { error: () => translate("checkout.validation.woreda") }),
  address: z.string().trim().min(5, { error: () => translate("checkout.validation.address") }),
  notes: z.string().trim().max(300, { error: () => translate("checkout.validation.notes") }).optional(),
  paymentMethod: z.string().min(1, { error: () => translate("checkout.validation.paymentMethod") }),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
