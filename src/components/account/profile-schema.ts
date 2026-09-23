import { z } from "zod"

import { ETHIOPIA_PHONE_REGEX, ETHIOPIA_PHONE_MESSAGE } from "@/lib/phone"

// Phone is optional here (signup never collects one) but must be a valid
// Ethiopian number when the user does provide it — an empty string is the
// one value the format regex can't itself allow through.
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  phone: z
    .string()
    .trim()
    .regex(ETHIOPIA_PHONE_REGEX, ETHIOPIA_PHONE_MESSAGE)
    .or(z.literal("")),
})

export type ProfileValues = z.infer<typeof profileSchema>
