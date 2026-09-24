// One-time seed script — run manually, AFTER the catalog is seeded:
//
//   node --env-file=.env --import tsx scripts/seed-images.ts
//   node --env-file=.env --import tsx scripts/seed-images.ts --cleanup-test-images
//
// Puts real photography on the seeded catalog: the 32 product photos and 8
// category photos in scripts/seed-images/ are uploaded to the project's public
// `products` and `categories` Storage buckets, and the rows that point at them
// (product_images, categories.image_url) are updated. Uses the service-role key
// (bypasses RLS) — never run as part of the app or the build.
//
// Idempotent: a file is named after a hash of its content
// (`photos/<slug>-<hash>.jpg`), so re-running uploads nothing new and the URL
// only changes when the picture does. Uploaded files are never overwritten —
// the storefront's image optimizer caches them for 30 days (see next.config.ts),
// so a changed picture must get a new URL.
//
// `--cleanup-test-images` additionally deletes anything left under a
// `perf-test/` folder in those buckets (synthetic images used to measure the
// image optimizer). It refuses to delete a file that a row still points at.
//
// Photos are from Unsplash (free licence, no attribution required); see
// scripts/seed-images/CREDITS.md for where each one came from.
import { createHash } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Run from the repository root (as the npm seed scripts are).
const ROOT = join(process.cwd(), "scripts", "seed-images")

// Uploads one file and returns its public URL.
async function upload(bucket: "products" | "categories", slug: string, file: string): Promise<string> {
  const bytes = readFileSync(file)
  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 8)
  const path = `photos/${slug}-${hash}.jpg`

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true, // same content => same bytes; harmless on a re-run
  })
  if (error) throw new Error(`Upload ${bucket}/${path} failed: ${error.message}`)

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

async function seedProducts() {
  const dir = join(ROOT, "products")
  const files = readdirSync(dir).filter((f) => f.endsWith(".jpg"))
  console.log(`Products: ${files.length} photos`)

  for (const name of files) {
    const slug = name.replace(/\.jpg$/, "")
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name_en")
      .eq("slug", slug)
      .maybeSingle()
    if (error) throw new Error(`Looking up product ${slug}: ${error.message}`)
    if (!product) {
      console.log(`  - ${slug}: no such product, skipped`)
      continue
    }

    const url = await upload("products", slug, join(dir, name))

    // The product's main image is its first row (lowest sort_order).
    const { data: existing, error: selectError } = await supabase
      .from("product_images")
      .select("id, image_url")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true })
      .limit(1)
    if (selectError) throw new Error(`Reading images of ${slug}: ${selectError.message}`)

    const first = existing?.[0]
    if (first?.image_url === url) {
      console.log(`  - ${slug}: up to date`)
      continue
    }

    const write = first
      ? supabase.from("product_images").update({ image_url: url, alt_text: product.name_en }).eq("id", first.id)
      : supabase.from("product_images").insert({ product_id: product.id, image_url: url, alt_text: product.name_en, sort_order: 0 })
    const { error: writeError } = await write
    if (writeError) throw new Error(`Writing image of ${slug}: ${writeError.message}`)
    console.log(`  - ${slug}: ${first ? "updated" : "added"}`)
  }
}

async function seedCategories() {
  const dir = join(ROOT, "categories")
  const files = readdirSync(dir).filter((f) => f.endsWith(".jpg"))
  console.log(`Categories: ${files.length} photos`)

  for (const name of files) {
    const slug = name.replace(/\.jpg$/, "")
    const { data: category, error } = await supabase
      .from("categories")
      .select("id, image_url")
      .eq("slug", slug)
      .maybeSingle()
    if (error) throw new Error(`Looking up category ${slug}: ${error.message}`)
    if (!category) {
      console.log(`  - ${slug}: no such category, skipped`)
      continue
    }

    const url = await upload("categories", slug, join(dir, name))
    if (category.image_url === url) {
      console.log(`  - ${slug}: up to date`)
      continue
    }
    const { error: writeError } = await supabase.from("categories").update({ image_url: url }).eq("id", category.id)
    if (writeError) throw new Error(`Writing image of ${slug}: ${writeError.message}`)
    console.log(`  - ${slug}: updated`)
  }
}

// Deletes the synthetic `perf-test/` files, but only those no row references.
async function cleanupTestImages() {
  for (const bucket of ["products", "categories"] as const) {
    const { data: files, error } = await supabase.storage.from(bucket).list("perf-test", { limit: 1000 })
    if (error) throw new Error(`Listing ${bucket}/perf-test: ${error.message}`)
    const paths = (files ?? []).filter((f) => f.id).map((f) => `perf-test/${f.name}`)
    if (paths.length === 0) {
      console.log(`Cleanup ${bucket}: nothing under perf-test/`)
      continue
    }

    const table = bucket === "products" ? "product_images" : "categories"
    const { data: rows, error: rowsError } = await supabase.from(table).select("image_url").like("image_url", "%/perf-test/%")
    if (rowsError) throw new Error(`Checking references in ${table}: ${rowsError.message}`)
    if ((rows ?? []).length > 0) {
      console.log(`Cleanup ${bucket}: ${rows!.length} row(s) still point at perf-test files — not deleting. Seed the photos first.`)
      continue
    }

    const { error: removeError } = await supabase.storage.from(bucket).remove(paths)
    if (removeError) throw new Error(`Removing ${bucket}/perf-test: ${removeError.message}`)
    console.log(`Cleanup ${bucket}: removed ${paths.length} test file(s)`)
  }
}

async function main() {
  if (process.argv.includes("--cleanup-test-images")) {
    await cleanupTestImages()
    return
  }
  await seedCategories()
  await seedProducts()
  console.log("Image seed complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
