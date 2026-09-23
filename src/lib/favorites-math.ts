import type { ProductWithCategory } from "@/lib/services/catalog"

// Pure: keeps the order the user favorited things in, and drops ids whose
// product no longer exists / is inactive (same honesty discipline as
// resolveCartLines — no crash, no ghost card). Favorites has no quantity and
// isn't a CartLine, so it's a parallel helper rather than forced through
// cart's types.
export function resolveFavoriteProducts(
  ids: string[],
  products: ProductWithCategory[]
): ProductWithCategory[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is ProductWithCategory => !!p)
}
