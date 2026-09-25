import { describe, expect, it } from "vitest"

import { computeCartTotals, getInsufficientStockLines, resolveCartLines } from "@/lib/cart-math"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { makeProduct } from "@/test/factories"

function withCategory(overrides: Parameters<typeof makeProduct>[0] = {}): ProductWithCategory {
  return { ...makeProduct(overrides), categoryName: "Fashion", categoryNameAm: "ፋሽን", categorySlug: "fashion" }
}

describe("resolveCartLines", () => {
  it("pairs each cart line with its live product, keeping cart order", () => {
    const wallet = withCategory({ id: "wallet" })
    const watch = withCategory({ id: "watch" })
    const { resolvedLines, unavailableLines } = resolveCartLines(
      [
        { productId: "watch", quantity: 1 },
        { productId: "wallet", quantity: 2 },
      ],
      [wallet, watch]
    )
    expect(resolvedLines.map((r) => r.product.id)).toEqual(["watch", "wallet"])
    expect(resolvedLines[1].line.quantity).toBe(2)
    expect(unavailableLines).toEqual([])
  })

  it("reports a line whose product is gone as unavailable instead of dropping it silently", () => {
    const wallet = withCategory({ id: "wallet" })
    const { resolvedLines, unavailableLines } = resolveCartLines(
      [
        { productId: "wallet", quantity: 1 },
        { productId: "deleted-product", quantity: 3 },
      ],
      [wallet]
    )
    expect(resolvedLines).toHaveLength(1)
    expect(unavailableLines).toEqual([{ productId: "deleted-product", quantity: 3 }])
  })

  it("handles an empty cart", () => {
    expect(resolveCartLines([], [])).toEqual({ resolvedLines: [], unavailableLines: [] })
  })
})

describe("computeCartTotals", () => {
  it("adds price x quantity for every line", () => {
    const a = withCategory({ id: "a", price: 580 })
    const b = withCategory({ id: "b", price: 1900 })
    const { resolvedLines } = resolveCartLines(
      [
        { productId: "a", quantity: 2 },
        { productId: "b", quantity: 1 },
      ],
      [a, b]
    )
    expect(computeCartTotals(resolvedLines)).toEqual({ subtotal: 3060, savings: 0 })
  })

  it("counts savings only for products that are on sale, per unit", () => {
    const sale = withCategory({ id: "sale", price: 1850, compare_at_price: 2400 })
    const regular = withCategory({ id: "regular", price: 500 })
    const { resolvedLines } = resolveCartLines(
      [
        { productId: "sale", quantity: 2 },
        { productId: "regular", quantity: 1 },
      ],
      [sale, regular]
    )
    expect(computeCartTotals(resolvedLines)).toEqual({ subtotal: 4200, savings: 1100 })
  })

  it("ignores a 'compare at' price that is not higher than the price", () => {
    const notReallyOnSale = withCategory({ id: "x", price: 1000, compare_at_price: 1000 })
    const { resolvedLines } = resolveCartLines([{ productId: "x", quantity: 3 }], [notReallyOnSale])
    expect(computeCartTotals(resolvedLines).savings).toBe(0)
  })

  it("is zero for an empty cart", () => {
    expect(computeCartTotals([])).toEqual({ subtotal: 0, savings: 0 })
  })
})

describe("getInsufficientStockLines", () => {
  it("flags lines asking for more than is in stock, and only those", () => {
    const enough = withCategory({ id: "enough", stock: 5 })
    const exact = withCategory({ id: "exact", stock: 2 })
    const short = withCategory({ id: "short", stock: 1 })
    const soldOut = withCategory({ id: "sold-out", stock: 0 })
    const { resolvedLines } = resolveCartLines(
      [
        { productId: "enough", quantity: 3 },
        { productId: "exact", quantity: 2 },
        { productId: "short", quantity: 2 },
        { productId: "sold-out", quantity: 1 },
      ],
      [enough, exact, short, soldOut]
    )
    expect(getInsufficientStockLines(resolvedLines).map((r) => r.product.id)).toEqual(["short", "sold-out"])
  })
})
