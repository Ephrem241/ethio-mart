import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"

// The same limits the database's submit_contact_message applies (0019), so a
// message the form accepts is one the database accepts. `website` is the
// honeypot: a field hidden from people that only spam robots fill in.
export const contactSchema = z.object({
  name: z.string().trim().min(1, { error: () => translate("contactForm.errors.name") }).max(100, { error: () => translate("validation.tooLong", { max: 100 }) }),
  email: z.string().trim().max(254).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, { error: () => translate("validation.email") }),
  subject: z.string().trim().max(150, { error: () => translate("contactForm.errors.subjectTooLong") }),
  message: z
    .string()
    .trim()
    .min(10, { error: () => translate("contactForm.errors.messageLength") })
    .max(3000, { error: () => translate("contactForm.errors.messageLength") }),
  website: z.string(),
})

export type ContactValues = z.infer<typeof contactSchema>
