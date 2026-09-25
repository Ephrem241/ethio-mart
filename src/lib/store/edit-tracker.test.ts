import { describe, expect, it } from "vitest"

import { createEditTracker } from "@/lib/store/edit-tracker"

describe("edit tracker", () => {
  it("remembers each edited id once", () => {
    const tracker = createEditTracker()
    tracker.record("a")
    tracker.record("b")
    tracker.record("a")
    const { ids, all } = tracker.drain()
    expect([...ids].sort()).toEqual(["a", "b"])
    expect(all).toBe(false)
  })

  it("remembers that everything was changed", () => {
    const tracker = createEditTracker()
    tracker.recordAll()
    expect(tracker.drain().all).toBe(true)
  })

  it("forgets what it handed over, so an edit is only merged once", () => {
    const tracker = createEditTracker()
    tracker.record("a")
    tracker.recordAll()
    tracker.drain()
    const second = tracker.drain()
    expect(second.ids.size).toBe(0)
    expect(second.all).toBe(false)
  })

  it("keeps separate trackers separate (cart and favorites)", () => {
    const cart = createEditTracker()
    const favorites = createEditTracker()
    cart.record("product-1")
    expect(favorites.drain().ids.size).toBe(0)
    expect(cart.drain().ids.has("product-1")).toBe(true)
  })
})
