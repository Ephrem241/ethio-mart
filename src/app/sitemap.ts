import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

import { pagePath } from "@/lib/seo/metadata"
import { absoluteUrl } from "@/lib/seo/site"

// Rebuilt at most once an hour: new products show up within the hour without
// every crawler hit reading the whole catalog.
export const revalidate = 3600

// One <url> per page, in English, with the Amharic version alongside as an
// hreflang alternate (the ?lang=am URLs — see lib/seo/metadata.ts). Only pages
// that should appear in search results are listed: no cart, checkout, account,
// admin, sign-in or search pages, and no sort/filter variants.
function entry(
  path: string,
  extra: Pick<MetadataRoute.Sitemap[number], "lastModified" | "images"> = {},
  listing: { sale?: boolean } = {}
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(pagePath(path, "en", listing)),
    ...extra,
    alternates: {
      languages: {
        en: absoluteUrl(pagePath(path, "en", listing)),
        am: absoluteUrl(pagePath(path, "am", listing)),
      },
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    entry("/"),
    entry("/shop"),
    entry("/shop", {}, { sale: true }), // the Deals page
    entry("/categories"),
    // The footer's information pages.
    ...["/about", "/contact", "/delivery", "/returns", "/faq", "/privacy", "/terms"].map((path) => entry(path)),
  ]

  // Anonymous, cookie-free read of what a visitor may see anyway (RLS shows
  // anonymous users active rows only); the filter is repeated to be explicit.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("slug, created_at").eq("is_active", true).order("sort_order"),
    supabase
      .from("products")
      .select("slug, updated_at, product_images(image_url, sort_order)")
      .eq("is_active", true)
      .order("created_at"),
  ])

  // A catalog outage must not take the sitemap (or the build) down: serve the
  // fixed pages, and say so in the log. The next revalidation retries.
  if (categories.error || products.error) {
    console.error("[sitemap] catalog unavailable:", categories.error?.message ?? products.error?.message)
    return pages
  }

  for (const category of categories.data ?? []) {
    pages.push(entry(`/category/${category.slug}`, { lastModified: category.created_at }))
  }

  for (const product of products.data ?? []) {
    const images = [...(product.product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => absoluteUrl(image.image_url))
    pages.push(
      entry(`/product/${product.slug}`, {
        lastModified: product.updated_at,
        ...(images.length ? { images: images.slice(0, 1) } : {}),
      })
    )
  }

  return pages
}
