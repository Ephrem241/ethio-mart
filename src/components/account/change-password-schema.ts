import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: () => translate("account.settings.currentPasswordRequired") }),
  newPassword: z.string().min(8, { error: () => translate("auth.validation.passwordMin") }),
})

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
