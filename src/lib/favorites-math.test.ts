import { describe, expect, it } from "vitest"

import { resolveFavoriteProducts } from "@/lib/favorites-math"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { makeProduct } from "@/test/factories"

const product = (id: string): ProductWithCategory => ({
  ...makeProduct({ id }),
  categoryName: "",
  categoryNameAm: "",
  categorySlug: "",
})

describe("resolveFavoriteProducts", () => {
  it("keeps the order the shopper favorited things in", () => {
    const products = [product("a"), product("b"), product("c")]
    expect(resolveFavoriteProducts(["c", "a"], products).map((p) => p.id)).toEqual(["c", "a"])
  })

  it("drops ids whose product no longer exists, without failing", () => {
    const products = [product("a")]
    expect(resolveFavoriteProducts(["gone", "a", "also-gone"], products).map((p) => p.id)).toEqual(["a"])
  })

  it("returns nothing for no favorites", () => {
    expect(resolveFavoriteProducts([], [product("a")])).toEqual([])
  })
})
