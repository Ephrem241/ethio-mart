import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"

// The same limit the database's reply_to_contact_message applies (0020).
export const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { error: () => translate("admin.messages.errors.replyLength") })
    .max(5000, { error: () => translate("admin.messages.errors.replyLength") }),
})

export type ReplyValues = z.infer<typeof replySchema>
