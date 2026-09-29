import { describe, expect, it } from "vitest"

import { productSchema } from "@/components/admin/product-schema"
import { categorySchema } from "@/components/admin/category-schema"

const product = {
  name_en: "Woven Basket",
  name_am: "ቅርጫት ትልቅ",
  slug: "woven-basket",
  description_en: "A sturdy hand-woven basket.",
  description_am: "ጠንካራ በእጅ የተሠራ ቅርጫት።",
  price: 720,
  compare_at_price: null,
  stock: 12,
  sku: "HL-001",
  category_id: "c1",
  image_urls: [],
  is_featured: false,
  is_popular: false,
  is_active: true,
}

const category = {
  name_en: "Kitchen",
  name_am: "ወጥ ቤት",
  slug: "kitchen",
  description_en: "Cookware and more.",
  description_am: "የወጥ ቤት ዕቃዎች።",
  image_url: "",
}

const fieldsWithErrors = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.path.join("."))

describe("productSchema", () => {
  it("accepts a complete product", () => {
    expect(productSchema.safeParse(product).success).toBe(true)
  })

  it("rejects a bad slug, a non-positive price, negative or fractional stock", () => {
    for (const [field, value] of [
      ["slug", "Woven Basket"],
      ["slug", "-basket"],
      ["price", 0],
      ["stock", -1],
      ["stock", 1.5],
      ["compare_at_price", -10],
    ] as const) {
      expect(fieldsWithErrors(productSchema.safeParse({ ...product, [field]: value }))).toContain(field)
    }
  })

  it("takes a list of photo addresses, up to 8, each a real URL", () => {
    const url = (n: number) => `https://example.com/p${n}.jpg`
    expect(productSchema.safeParse({ ...product, image_urls: [url(1), url(2), url(3)] }).success).toBe(true)
    expect(fieldsWithErrors(productSchema.safeParse({ ...product, image_urls: [url(1), "not a url"] }))).toContain("image_urls.1")
    expect(fieldsWithErrors(productSchema.safeParse({ ...product, image_urls: Array.from({ length: 9 }, (_, i) => url(i)) }))).toContain("image_urls")
  })

  it("needs both languages' name and description", () => {
    const errors = fieldsWithErrors(productSchema.safeParse({ ...product, name_am: "", description_en: "short" }))
    expect(errors).toEqual(expect.arrayContaining(["name_am", "description_en"]))
  })
})

describe("categorySchema", () => {
  it("accepts a category with or without an image", () => {
    expect(categorySchema.safeParse(category).success).toBe(true)
    expect(categorySchema.safeParse({ ...category, image_url: "https://example.com/k.jpg" }).success).toBe(true)
  })

  it("rejects a bad slug and a malformed image address", () => {
    expect(fieldsWithErrors(categorySchema.safeParse({ ...category, slug: "Kitchen & Dining" }))).toContain("slug")
    expect(fieldsWithErrors(categorySchema.safeParse({ ...category, image_url: "kitchen.jpg" }))).toContain("image_url")
  })
})
