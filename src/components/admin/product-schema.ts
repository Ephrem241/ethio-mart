import { z } from "zod"

// Plain z.number()/nullable() rather than z.coerce.number() — z.coerce's
// input type is `unknown`, which conflicts with react-hook-form's single
// TFieldValues generic (it needs one type for both the raw form values and
// the validated output). Numeric/nullable string fields are converted
// explicitly via each field's own `setValueAs` in AdminProductForm instead,
// so this schema's input and output shapes are identical and RHF's types
// resolve cleanly.
export const productSchema = z.object({
  name_en: z.string().trim().min(2, "Enter an English name."),
  name_am: z.string().trim().min(2, "Enter an Amharic name."),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description_en: z.string().trim().min(10, "Enter an English description."),
  description_am: z.string().trim().min(10, "Enter an Amharic description."),
  price: z.number().positive("Enter a price greater than 0."),
  compare_at_price: z.number().positive("Must be greater than 0.").nullable(),
  stock: z.number().int().min(0, "Stock can't be negative."),
  sku: z.string().trim().min(1, "Enter a SKU."),
  category_id: z.string().min(1, "Select a category."),
  image_url: z.string().trim().url("Enter a valid URL.").nullable(),
  is_featured: z.boolean(),
  is_popular: z.boolean(),
  is_active: z.boolean(),
})

export type ProductValues = z.infer<typeof productSchema>
