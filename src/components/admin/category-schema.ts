import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"

export const categorySchema = z.object({
  name_en: z.string().trim().min(2, { error: () => translate("admin.validation.nameEn") }),
  name_am: z.string().trim().min(2, { error: () => translate("admin.validation.nameAm") }),
  slug: z
    .string()
    .trim()
    .min(2, { error: () => translate("admin.validation.slug") })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: () => translate("admin.validation.slugFormat") }),
  description_en: z.string().trim().min(5, { error: () => translate("admin.validation.descriptionEn") }),
  description_am: z.string().trim().min(5, { error: () => translate("admin.validation.descriptionAm") }),
  image_url: z.string().trim().url({ error: () => translate("admin.validation.url") }).optional().or(z.literal("")),
})

export type CategoryValues = z.infer<typeof categorySchema>
