import type { PostgrestError } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"
import { toProduct, type ProductRow } from "@/lib/services/catalog"

// Admin product/category management against the real database. Authorization
// is enforced by Postgres RLS (every write requires is_admin()), not by this
// file or the UI — a customer calling these same endpoints is refused. That
// refusal shows up as ZERO affected rows rather than an error, so every
// update/delete below asks for the affected rows back (.select()) and treats
// an empty result as a failure instead of reporting a silent success.
//
// Duplicate slugs / SKUs and "category still has products" are enforced by
// real constraints (UNIQUE, ON DELETE RESTRICT). The database is the only
// place that can check them without a race between the check and the write,
// so we attempt the write and translate the constraint error into the same
// friendly messages the UI has always shown.

export interface ProductFormValues {
  name_en: string
  name_am: string
  slug: string
  description_en: string
  description_am: string
  price: number
  compare_at_price: number | null
  stock: number
  sku: string
  category_id: string
  image_url: string | null
  is_featured: boolean
  is_popular: boolean
  is_active: boolean
}

export interface CategoryFormValues {
  name_en: string
  name_am: string
  slug: string
  description_en: string
  description_am: string
  image_url: string
}

type Result<T = undefined> = { success: true; data: T } | { success: false; error: string }

const NO_PERMISSION = "You don't have permission to do that."

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

function fail(error: string): { success: false; error: string } {
  return { success: false, error }
}

// Postgres constraint names follow <table>_<column>_key; match on that so
// the message names the right field.
function describe(error: PostgrestError, subject: "product" | "category"): string {
  const text = `${error.message} ${error.details ?? ""}`
  if (error.code === "23505") {
    if (/_sku_key/.test(text)) return "A product with this SKU already exists."
    return `A ${subject} with this slug already exists.`
  }
  if (error.code === "23503") {
    if (subject === "category") {
      return "Cannot delete a category with products assigned. Move or delete its products first."
    }
    return "Select a valid category."
  }
  if (error.code === "23514") return "One of the values is out of range."
  return error.message
}

const PRODUCT_SELECT = "*, product_images(id, image_url, sort_order)"

// ---------------------------------------------------------------------------
// Reads (admin sees inactive products/categories too — RLS: is_admin())
// ---------------------------------------------------------------------------

export async function fetchAdminProducts(): Promise<Product[]> {
  const { data, error } = await createClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to load products: ${error.message}`)
  return (data as ProductRow[]).map(toProduct)
}

// `null` when the product doesn't exist (or the id isn't even a UUID).
export async function fetchAdminProduct(id: string): Promise<Product | null> {
  const { data, error } = await createClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error?.code === "22P02") return null
  if (error) throw new Error(`Failed to load product: ${error.message}`)
  return data ? toProduct(data as ProductRow) : null
}

export async function fetchAdminCategories(): Promise<Category[]> {
  const { data, error } = await createClient()
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) throw new Error(`Failed to load categories: ${error.message}`)
  return data as Category[]
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// The form's single "image" maps onto the product's primary image row
// (sort_order 0) in `product_images`, matching the spec's table shape so
// multiple images can be added later without a schema change.
async function syncPrimaryImage(productId: string, imageUrl: string | null, altText: string) {
  const supabase = createClient()

  if (!imageUrl) {
    await supabase.from("product_images").delete().eq("product_id", productId)
    return
  }

  const { data: existing } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1)

  if (existing && existing.length > 0) {
    await supabase
      .from("product_images")
      .update({ image_url: imageUrl, alt_text: altText })
      .eq("id", existing[0].id)
  } else {
    await supabase
      .from("product_images")
      .insert({ product_id: productId, image_url: imageUrl, alt_text: altText, sort_order: 0 })
  }
}

function productColumns(input: ProductFormValues) {
  return {
    category_id: input.category_id,
    name_en: input.name_en.trim(),
    name_am: input.name_am.trim(),
    slug: input.slug.trim(),
    description_en: input.description_en.trim(),
    description_am: input.description_am.trim(),
    price: input.price,
    compare_at_price: input.compare_at_price,
    stock: input.stock,
    sku: input.sku.trim(),
    is_featured: input.is_featured,
    is_popular: input.is_popular,
    is_active: input.is_active,
  }
}

export async function createProduct(input: ProductFormValues): Promise<Result<Product>> {
  if (!isValidSlug(input.slug.trim())) {
    return fail("Slug must be lowercase letters, numbers, and hyphens only.")
  }

  const { data, error } = await createClient()
    .from("products")
    .insert(productColumns(input))
    .select(PRODUCT_SELECT)
    .single()

  if (error) return fail(describe(error, "product"))

  const imageUrl = input.image_url?.trim() || null
  await syncPrimaryImage(data.id, imageUrl, input.name_en.trim())
  return ok(toProduct({ ...(data as ProductRow), product_images: imageUrl ? [{ image_url: imageUrl, sort_order: 0 }] : [] }))
}

export async function updateProduct(id: string, input: ProductFormValues): Promise<Result<Product>> {
  if (!isValidSlug(input.slug.trim())) {
    return fail("Slug must be lowercase letters, numbers, and hyphens only.")
  }

  const { data, error } = await createClient()
    .from("products")
    .update(productColumns(input))
    .eq("id", id)
    .select(PRODUCT_SELECT)

  if (error) return fail(describe(error, "product"))
  if (!data || data.length === 0) return fail("Product not found.")

  const imageUrl = input.image_url?.trim() || null
  await syncPrimaryImage(id, imageUrl, input.name_en.trim())
  return ok(toProduct({ ...(data[0] as ProductRow), product_images: imageUrl ? [{ image_url: imageUrl, sort_order: 0 }] : [] }))
}

// No blocking guard: order line items are point-in-time snapshots whose
// product link is ON DELETE SET NULL, and cart lines / favorites / images
// cascade — deleting a product never corrupts existing orders.
export async function deleteProduct(id: string): Promise<Result> {
  const { data, error } = await createClient().from("products").delete().eq("id", id).select("id")
  if (error) return fail(describe(error, "product"))
  if (!data || data.length === 0) return fail(NO_PERMISSION)
  return ok(undefined)
}

async function setProductFlag(id: string, changes: Partial<Pick<Product, "is_active" | "is_featured" | "is_popular">>): Promise<Result> {
  const { data, error } = await createClient().from("products").update(changes).eq("id", id).select("id")
  if (error) return fail(error.message)
  if (!data || data.length === 0) return fail(NO_PERMISSION)
  return ok(undefined)
}

export const setProductActive = (id: string, isActive: boolean) => setProductFlag(id, { is_active: isActive })
export const setProductFeatured = (id: string, isFeatured: boolean) => setProductFlag(id, { is_featured: isFeatured })
export const setProductPopular = (id: string, isPopular: boolean) => setProductFlag(id, { is_popular: isPopular })

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(input: CategoryFormValues): Promise<Result<Category>> {
  const slug = input.slug.trim()
  if (!isValidSlug(slug)) return fail("Slug must be lowercase letters, numbers, and hyphens only.")

  const supabase = createClient()
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name_en: input.name_en.trim(),
      name_am: input.name_am.trim(),
      slug,
      description_en: input.description_en.trim(),
      description_am: input.description_am.trim(),
      image_url: input.image_url.trim(),
      sort_order: (last?.[0]?.sort_order ?? 0) + 1,
      is_active: true,
    })
    .select("*")
    .single()

  if (error) return fail(describe(error, "category"))
  return ok(data as Category)
}

export async function updateCategory(id: string, input: CategoryFormValues): Promise<Result<Category>> {
  const slug = input.slug.trim()
  if (!isValidSlug(slug)) return fail("Slug must be lowercase letters, numbers, and hyphens only.")

  const { data, error } = await createClient()
    .from("categories")
    .update({
      name_en: input.name_en.trim(),
      name_am: input.name_am.trim(),
      slug,
      description_en: input.description_en.trim(),
      description_am: input.description_am.trim(),
      image_url: input.image_url.trim(),
    })
    .eq("id", id)
    .select("*")

  if (error) return fail(describe(error, "category"))
  if (!data || data.length === 0) return fail("Category not found.")
  return ok(data[0] as Category)
}

// Block, don't cascade: products.category_id is ON DELETE RESTRICT, so the
// database itself refuses (error 23503) — no window where a product could be
// assigned between a check and the delete.
export async function deleteCategory(id: string): Promise<Result> {
  const { data, error } = await createClient().from("categories").delete().eq("id", id).select("id")
  if (error) return fail(describe(error, "category"))
  if (!data || data.length === 0) return fail(NO_PERMISSION)
  return ok(undefined)
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<Result> {
  const { data, error } = await createClient()
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id")
  if (error) return fail(error.message)
  if (!data || data.length === 0) return fail(NO_PERMISSION)
  return ok(undefined)
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<Result> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })

  if (error) return fail(error.message)
  const sorted = data as { id: string; sort_order: number }[]

  const index = sorted.findIndex((c) => c.id === id)
  if (index === -1) return fail("Category not found.")

  const swapWith = direction === "up" ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= sorted.length) return ok(undefined)

  const reordered = [...sorted]
  ;[reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]]

  // Renumber 1..N so repeated moves never accumulate gaps or duplicates.
  const results = await Promise.all(
    reordered.map((c, i) =>
      c.sort_order === i + 1
        ? Promise.resolve({ error: null })
        : supabase.from("categories").update({ sort_order: i + 1 }).eq("id", c.id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return fail(failed.error.message)
  return ok(undefined)
}
