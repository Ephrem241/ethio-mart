import { z } from "zod"

export const categorySchema = z.object({
  name_en: z.string().trim().min(2, "Enter an English name."),
  name_am: z.string().trim().min(2, "Enter an Amharic name."),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description_en: z.string().trim().min(5, "Enter an English description."),
  description_am: z.string().trim().min(5, "Enter an Amharic description."),
  image_url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
})

export type CategoryValues = z.infer<typeof categorySchema>
