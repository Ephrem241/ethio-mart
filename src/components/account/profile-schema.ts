import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"
import { ETHIOPIA_PHONE_REGEX } from "@/lib/phone"

// Phone is optional here (signup never collects one) but must be a valid
// Ethiopian number when the user does provide it — an empty string is the
// one value the format regex can't itself allow through.
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, { error: () => translate("account.profile.validation.fullName") }),
  phone: z
    .string()
    .trim()
    .regex(ETHIOPIA_PHONE_REGEX, { error: () => translate("validation.phone") })
    .or(z.literal("")),
})

export type ProfileValues = z.infer<typeof profileSchema>
