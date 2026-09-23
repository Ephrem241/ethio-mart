import { createClient } from "@/lib/supabase/client"
import type { Category } from "@/lib/data/categories"
import {
  toProduct,
  type ProductRow,
  type ProductWithCategory,
} from "@/lib/services/catalog"
import { UUID_RE } from "@/lib/services/cart-remote"

// Browser-side catalog reads, for client components that only know product
// ids (cart lines, favorites, checkout) or need type-ahead (search bar).
// Server Components use catalog-queries.ts instead.

type ProductWithCategoryJoin = ProductRow & {
  categories: { name_en: string; slug: string } | null
}

function toProductWithCategory(row: ProductWithCategoryJoin): ProductWithCategory {
  const { categories: category, ...productRow } = row
  return {
    ...toProduct(productRow),
    categoryName: category?.name_en ?? "",
    categorySlug: category?.slug ?? "",
  }
}

const PRODUCT_SELECT = "*, product_images(image_url, sort_order), categories(name_en, slug)"

// Active products only, matching what a shopper can actually buy. An id that
// no longer resolves (deleted or deactivated product) is simply absent, which
// callers already treat as "no longer available" (cart, favorites).
export async function fetchProductsByIds(ids: string[]): Promise<ProductWithCategory[]> {
  // Carts saved before real accounts used slug-style ids that aren't UUIDs;
  // asking Postgres for one is an error, not an empty result.
  const validIds = ids.filter((id) => UUID_RE.test(id))
  if (validIds.length === 0) return []

  const { data, error } = await createClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", validIds)
    .eq("is_active", true)

  if (error) throw new Error(`Failed to load products: ${error.message}`)
  return (data as ProductWithCategoryJoin[]).map(toProductWithCategory)
}

export interface SearchSuggestions {
  products: { id: string; slug: string; name_en: string }[]
  categories: { id: string; slug: string; name_en: string }[]
}

// Escape the characters PostgREST/LIKE treat specially so a shopper typing
// "50%" or "a_b" searches for those literal characters.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export async function searchSuggestions(query: string): Promise<SearchSuggestions> {
  const pattern = `%${escapeLike(query.trim())}%`
  const supabase = createClient()

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name_en")
      .eq("is_active", true)
      .ilike("name_en", pattern)
      .limit(5),
    supabase
      .from("categories")
      .select("id, slug, name_en")
      .eq("is_active", true)
      .ilike("name_en", pattern)
      .limit(3),
  ])

  return {
    products: productsResult.data ?? [],
    categories: (categoriesResult.data as Pick<Category, "id" | "slug" | "name_en">[] | null) ?? [],
  }
}
