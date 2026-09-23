import { z } from "zod"

import { ETHIOPIA_PHONE_REGEX, ETHIOPIA_PHONE_MESSAGE } from "@/lib/phone"

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().trim().regex(ETHIOPIA_PHONE_REGEX, ETHIOPIA_PHONE_MESSAGE),
  city: z.string().min(1, "Select a city."),
  subCity: z.string().trim().min(2, "Enter your sub-city."),
  woreda: z.string().trim().min(1, "Enter your woreda."),
  address: z.string().trim().min(5, "Enter your street address."),
  notes: z.string().trim().max(300, "Keep notes under 300 characters.").optional(),
  paymentMethod: z.string().min(1, "Select a payment method."),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
