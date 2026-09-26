import { describe, expect, it } from "vitest"

import { createEditTracker, type TrackerStorage } from "@/lib/store/edit-tracker"

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: TrackerStorage & { data: Map<string, string> } = {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
  return storage
}

describe("edit tracker", () => {
  it("remembers each edited id once", () => {
    const tracker = createEditTracker()
    tracker.record("a")
    tracker.record("b")
    tracker.record("a")
    const { edits } = tracker.pending()
    expect([...edits.ids].sort()).toEqual(["a", "b"])
    expect(edits.all).toBe(false)
  })

  it("remembers that everything was changed", () => {
    const tracker = createEditTracker()
    tracker.recordAll()
    expect(tracker.pending().edits.all).toBe(true)
  })

  it("does not forget an unconfirmed edit just because it was read", () => {
    const tracker = createEditTracker()
    tracker.record("a")
    tracker.pending()
    expect(tracker.pending().edits.ids.has("a")).toBe(true)
  })

  it("keeps separate trackers separate (cart and favorites)", () => {
    const cart = createEditTracker()
    const favorites = createEditTracker()
    cart.record("product-1")
    expect(favorites.pending().edits.ids.size).toBe(0)
    expect(cart.pending().edits.ids.has("product-1")).toBe(true)
  })

  describe("forgetting an edit only once the server has it", () => {
    it("forgets an edit when its save is confirmed", () => {
      const tracker = createEditTracker()
      const confirmed = tracker.record("a")
      tracker.record("b")
      tracker.pending() // this page's edits were merged once
      confirmed()
      expect([...tracker.pending().edits.ids]).toEqual(["b"])
    })

    it("still hands over a confirmed edit once, so a snapshot read before the save cannot undo it", () => {
      const tracker = createEditTracker()
      const confirmed = tracker.record("a")
      confirmed() // the save succeeded while the server's snapshot was still on its way
      expect([...tracker.pending().edits.ids]).toEqual(["a"]) // that stale snapshot arrives: the tap still wins
      expect(tracker.pending().edits.ids.size).toBe(0) // ...and it is only handed over once
    })

    it("keeps a newer edit of the same item when an older save finishes late", () => {
      const tracker = createEditTracker()
      const firstSave = tracker.record("a") // quantity 1
      const secondSave = tracker.record("a") // quantity 2, before the first save came back
      tracker.pending() // this page's edits were merged once
      firstSave()
      expect(tracker.pending().edits.ids.has("a")).toBe(true)
      secondSave()
      expect(tracker.pending().edits.ids.has("a")).toBe(false)
    })

    it("forgets what a sync confirms, but not what was edited again after the list was taken", () => {
      const tracker = createEditTracker()
      tracker.record("a")
      tracker.record("b")
      const unsaved = tracker.pending()
      tracker.record("b") // the shopper changed it again while the sync was running
      unsaved.settle("a")
      unsaved.settle("b")
      expect([...tracker.pending().edits.ids]).toEqual(["b"])
    })

    it("settling something that was never edited does nothing", () => {
      const tracker = createEditTracker()
      tracker.record("a")
      tracker.pending().settle("zzz")
      expect(tracker.pending().edits.ids.has("a")).toBe(true)
    })

    it("forgets 'everything was changed' only if it did not happen again", () => {
      const tracker = createEditTracker()
      const confirmed = tracker.recordAll()
      const unsaved = tracker.pending()
      tracker.recordAll()
      confirmed()
      unsaved.settleAll()
      expect(tracker.pending().edits.all).toBe(true) // the second emptying is still unconfirmed
      tracker.pending().settleAll()
      expect(tracker.pending().edits.all).toBe(false)
    })

    it("clear() forgets everything", () => {
      const tracker = createEditTracker()
      tracker.record("a")
      tracker.recordAll()
      tracker.clear()
      expect(tracker.pending().edits).toEqual({ ids: new Set(), all: false })
    })
  })

  // The bug this exists for: add to cart, reload before the save finished, and
  // the item vanished because nothing remembered the edit.
  describe("surviving a reload", () => {
    it("hands an unconfirmed edit to the next page", () => {
      const storage = fakeStorage()
      const before = createEditTracker(storage, "unsaved")
      before.record("a")
      before.record("b")
      before.recordAll()

      const after = createEditTracker(storage, "unsaved") // the reloaded page
      const { edits } = after.pending()
      expect([...edits.ids].sort()).toEqual(["a", "b"])
      expect(edits.all).toBe(true)
    })

    it("does not hand over an edit the server confirmed", () => {
      const storage = fakeStorage()
      const before = createEditTracker(storage, "unsaved")
      const confirmed = before.record("a")
      before.record("b")
      confirmed()

      const after = createEditTracker(storage, "unsaved")
      expect([...after.pending().edits.ids]).toEqual(["b"])
    })

    it("can confirm an edit a closed page left behind", () => {
      const storage = fakeStorage()
      createEditTracker(storage, "unsaved").record("a")

      const after = createEditTracker(storage, "unsaved")
      after.pending().settle("a")
      expect(createEditTracker(storage, "unsaved").pending().edits.ids.size).toBe(0)
    })

    it("leaves nothing in storage once everything is confirmed or cleared", () => {
      const storage = fakeStorage()
      const tracker = createEditTracker(storage, "unsaved")
      const confirmed = tracker.record("a")
      expect(storage.data.has("unsaved")).toBe(true)
      confirmed()
      expect(storage.data.has("unsaved")).toBe(false)

      tracker.record("b")
      tracker.clear()
      expect(storage.data.has("unsaved")).toBe(false)
    })

    it("keeps different keys apart", () => {
      const storage = fakeStorage()
      createEditTracker(storage, "cart").record("product-1")
      expect(createEditTracker(storage, "favorites").pending().edits.ids.size).toBe(0)
    })

    it("still tells a new edit from an old one after a reload", () => {
      const storage = fakeStorage()
      createEditTracker(storage, "unsaved").record("a")

      const after = createEditTracker(storage, "unsaved")
      const unsaved = after.pending()
      after.record("a") // edited again on the new page
      unsaved.settle("a") // the sync confirms the OLD edit
      expect(after.pending().edits.ids.has("a")).toBe(true)
    })
  })

  describe("when storage is missing or unusable", () => {
    it("works in memory only", () => {
      const tracker = createEditTracker(undefined)
      tracker.record("a")
      expect(tracker.pending().edits.ids.has("a")).toBe(true)
    })

    it("ignores corrupt saved data", () => {
      for (const bad of ["not json", "null", "42", '{"ids":"nope"}', '{"ids":{"a":"x"},"all":"y"}']) {
        const tracker = createEditTracker(fakeStorage({ unsaved: bad }), "unsaved")
        expect(tracker.pending().edits).toEqual({ ids: new Set(), all: false })
      }
    })

    it("keeps working when saving throws (storage full or blocked)", () => {
      const storage: TrackerStorage = {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError")
        },
        removeItem: () => {
          throw new Error("blocked")
        },
      }
      const tracker = createEditTracker(storage, "unsaved")
      const confirmed = tracker.record("a")
      expect(tracker.pending().edits.ids.has("a")).toBe(true)
      expect(() => confirmed()).not.toThrow()
      expect(tracker.pending().edits.ids.has("a")).toBe(false)
    })
  })
})
