import { describe, expect, it } from "vitest"

import { reconcileCart, reconcileFavorites, toLines, toQuantities } from "@/lib/reconcile"

const none = { ids: new Set<string>(), all: false }
const edited = (...ids: string[]) => ({ ids: new Set(ids), all: false })

// The sign-in sync must never lose something the shopper just did: their edits
// win over a server copy that may have been read before those edits landed.
describe("reconcileCart", () => {
  it("takes the server copy as it is when the shopper changed nothing", () => {
    const { merged, changed } = reconcileCart(toQuantities([{ productId: "a", quantity: 2 }]), new Map(), none)
    expect(toLines(merged)).toEqual([{ productId: "a", quantity: 2 }])
    expect(changed.size).toBe(0)
  })

  it("keeps a line the shopper added while the server copy was loading", () => {
    const server = toQuantities([{ productId: "a", quantity: 1 }])
    const local = toQuantities([
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 2 },
    ])
    const { merged, changed } = reconcileCart(server, local, edited("b"))
    expect(merged.get("b")).toBe(2)
    expect(merged.get("a")).toBe(1)
    expect([...changed]).toEqual(["b"])
  })

  it("uses the local quantity for a line the shopper changed, not the older server one", () => {
    const server = toQuantities([{ productId: "a", quantity: 1 }])
    const local = toQuantities([{ productId: "a", quantity: 2 }]) // clicked "add" twice
    expect(reconcileCart(server, local, edited("a")).merged.get("a")).toBe(2)
  })

  it("removes a line the shopper removed, even though the server still has it", () => {
    const server = toQuantities([
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 1 },
    ])
    const local = toQuantities([{ productId: "b", quantity: 1 }])
    const { merged } = reconcileCart(server, local, edited("a"))
    expect(merged.has("a")).toBe(false)
    expect(merged.get("b")).toBe(1)
  })

  it("leaves lines from another device alone when the shopper did not touch them", () => {
    const server = toQuantities([
      { productId: "phone-item", quantity: 4 },
      { productId: "mine", quantity: 1 },
    ])
    const local = toQuantities([{ productId: "mine", quantity: 3 }])
    const { merged } = reconcileCart(server, local, edited("mine"))
    expect(merged.get("phone-item")).toBe(4)
    expect(merged.get("mine")).toBe(3)
  })

  it("treats 'emptied the cart' as touching every line on both sides", () => {
    const server = toQuantities([
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 5 },
    ])
    const { merged, changed } = reconcileCart(server, new Map(), { ids: new Set(), all: true })
    expect(merged.size).toBe(0)
    expect([...changed].sort()).toEqual(["a", "b"])
  })

  it("after emptying and adding one thing, keeps only that thing", () => {
    const server = toQuantities([{ productId: "old", quantity: 2 }])
    const local = toQuantities([{ productId: "new", quantity: 1 }])
    const { merged } = reconcileCart(server, local, { ids: new Set(["new"]), all: true })
    expect(toLines(merged)).toEqual([{ productId: "new", quantity: 1 }])
  })
})

describe("reconcileFavorites", () => {
  it("takes the server list when nothing was toggled", () => {
    expect([...reconcileFavorites(["a", "b"], new Set(["a", "b"]), none)]).toEqual(["a", "b"])
  })

  it("keeps a heart tapped while the server list was loading", () => {
    expect(reconcileFavorites(["a"], new Set(["a", "b"]), edited("b")).has("b")).toBe(true)
  })

  it("removes a favorite the shopper un-hearted", () => {
    const merged = reconcileFavorites(["a", "b"], new Set(["b"]), edited("a"))
    expect([...merged]).toEqual(["b"])
  })

  it("does not duplicate an id already on the server", () => {
    expect([...reconcileFavorites(["a"], new Set(["a"]), edited("a"))]).toEqual(["a"])
  })
})
