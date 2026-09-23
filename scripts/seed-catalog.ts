// One-time seed script — run manually via `npm run seed:catalog`, AFTER all
// migrations in supabase/migrations/ have been applied. Never run as part
// of the app/build. Uses the service-role key (bypasses RLS) to insert the
// existing mock seed data into the real database. Idempotent: safe to
// re-run (checks for existing rows by slug/sku before inserting).
//
// Imports categories/products DIRECTLY from the existing mock data files —
// not hand-transcribed SQL — to eliminate any risk of transcription errors
// in the Amharic strings.
import { createClient } from "@supabase/supabase-js"
import { categories as seedCategories } from "../src/lib/data/categories"
import { products as seedProducts } from "../src/lib/data/products"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`Seeding ${seedCategories.length} categories...`)
  const categoryIdBySlug = new Map<string, string>()

  for (const category of seedCategories) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category.slug)
      .maybeSingle()

    if (existing) {
      categoryIdBySlug.set(category.slug, existing.id)
      console.log(`  - ${category.slug} already exists, skipping.`)
      continue
    }

    const { data: inserted, error } = await supabase
      .from("categories")
      .insert({
        name_en: category.name_en,
        name_am: category.name_am,
        slug: category.slug,
        description_en: category.description_en,
        description_am: category.description_am,
        image_url: category.image_url,
        sort_order: category.sort_order,
        is_active: category.is_active,
      })
      .select("id")
      .single()

    if (error || !inserted) {
      throw new Error(`Failed to insert category ${category.slug}: ${error?.message}`)
    }
    categoryIdBySlug.set(category.slug, inserted.id)
    console.log(`  - inserted ${category.slug}`)
  }

  console.log(`Seeding ${seedProducts.length} products...`)
  let inserted = 0
  let skipped = 0

  for (const product of seedProducts) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("sku", product.sku)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    // The mock's category_id is the category's own slug (e.g. "fashion"),
    // set that way originally so seed products and categories could share
    // one human-readable id before real UUIDs existed.
    const realCategoryId = categoryIdBySlug.get(product.category_id)
    if (!realCategoryId) {
      throw new Error(`Product ${product.sku} references unknown category "${product.category_id}".`)
    }

    const { error } = await supabase.from("products").insert({
      category_id: realCategoryId,
      name_en: product.name_en,
      name_am: product.name_am,
      slug: product.slug,
      description_en: product.description_en,
      description_am: product.description_am,
      price: product.price,
      compare_at_price: product.compare_at_price,
      stock: product.stock,
      sku: product.sku,
      is_featured: product.is_featured,
      is_popular: product.is_popular ?? false,
      is_active: product.is_active,
      rating: product.rating ?? null,
      created_at: product.created_at,
      updated_at: product.updated_at,
    })

    if (error) {
      throw new Error(`Failed to insert product ${product.sku}: ${error.message}`)
    }
    inserted++
  }

  console.log(`Products: ${inserted} inserted, ${skipped} already existed.`)
  console.log("Catalog seed complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
