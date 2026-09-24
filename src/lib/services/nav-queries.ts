import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

// The header and footer list the shop's categories on every page. This is a
// deliberately tiny query (four columns, active categories only) rather than
// getCategories() — that one also loads every product to count them, which the
// layout must not pay for on pages that never show a catalog (cart, account…).
export interface NavCategory {
  id: string
  slug: string
  name_en: string
  name_am: string | null
}

// `cache` = one query per request, however many components ask.
export const getNavCategories = cache(async (): Promise<NavCategory[]> => {
  const { data, error } = await (await createClient())
    .from("categories")
    .select("id, slug, name_en, name_am")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    // Navigation must never take a page down; fall back to no category links.
    console.error("Failed to load navigation categories:", error.message) // i18n-ignore: developer-facing
    return []
  }
  return data ?? []
})
