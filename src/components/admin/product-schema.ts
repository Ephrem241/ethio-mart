import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { translate } from "@/lib/i18n/translate"

// Plain z.number()/nullable() rather than z.coerce.number() — z.coerce's
// input type is `unknown`, which conflicts with react-hook-form's single
// TFieldValues generic (it needs one type for both the raw form values and
// the validated output). Numeric/nullable string fields are converted
// explicitly via each field's own `setValueAs` in AdminProductForm instead,
// so this schema's input and output shapes are identical and RHF's types
// resolve cleanly.
//
// Messages are functions so they are looked up when validation runs, in the
// language the admin panel is showing at that moment.
export const productSchema = z.object({
  name_en: z.string().trim().min(2, { error: () => translate("admin.validation.nameEn") }),
  name_am: z.string().trim().min(2, { error: () => translate("admin.validation.nameAm") }),
  slug: z
    .string()
    .trim()
    .min(2, { error: () => translate("admin.validation.slug") })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: () => translate("admin.validation.slugFormat") }),
  description_en: z.string().trim().min(10, { error: () => translate("admin.validation.descriptionEn") }),
  description_am: z.string().trim().min(10, { error: () => translate("admin.validation.descriptionAm") }),
  price: z.number().positive({ error: () => translate("admin.validation.price") }),
  compare_at_price: z.number().positive({ error: () => translate("admin.validation.compareAt") }).nullable(),
  stock: z.number().int().min(0, { error: () => translate("admin.validation.stock") }),
  sku: z.string().trim().min(1, { error: () => translate("admin.validation.sku") }),
  category_id: z.string().min(1, { error: () => translate("admin.validation.category") }),
  image_url: z.string().trim().url({ error: () => translate("admin.validation.url") }).nullable(),
  is_featured: z.boolean(),
  is_popular: z.boolean(),
  is_active: z.boolean(),
})

export type ProductValues = z.infer<typeof productSchema>
