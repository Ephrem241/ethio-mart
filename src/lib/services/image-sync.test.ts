import { describe, expect, it } from "vitest"

import { planImageSync, type ImageRow } from "@/lib/services/image-sync"

const rows: ImageRow[] = [
  { id: "a", image_url: "https://x/a.jpg", sort_order: 0 },
  { id: "b", image_url: "https://x/b.jpg", sort_order: 1 },
  { id: "c", image_url: "https://x/c.jpg", sort_order: 2 },
]

describe("planImageSync", () => {
  it("writes nothing when the list is unchanged", () => {
    expect(planImageSync(rows, ["https://x/a.jpg", "https://x/b.jpg", "https://x/c.jpg"])).toEqual({ remove: [], reorder: [], insert: [] })
  })

  it("only moves rows when the photos are reordered", () => {
    expect(planImageSync(rows, ["https://x/c.jpg", "https://x/a.jpg", "https://x/b.jpg"])).toEqual({
      remove: [],
      reorder: [
        { id: "c", sort_order: 0 },
        { id: "a", sort_order: 1 },
        { id: "b", sort_order: 2 },
      ],
      insert: [],
    })
  })

  it("removes dropped photos and closes the gap", () => {
    expect(planImageSync(rows, ["https://x/a.jpg", "https://x/c.jpg"])).toEqual({
      remove: ["b"],
      reorder: [{ id: "c", sort_order: 1 }],
      insert: [],
    })
  })

  it("inserts new photos at their position", () => {
    expect(planImageSync(rows.slice(0, 1), ["https://x/new.jpg", "https://x/a.jpg"])).toEqual({
      remove: [],
      reorder: [{ id: "a", sort_order: 1 }],
      insert: [{ image_url: "https://x/new.jpg", sort_order: 0 }],
    })
  })

  it("an empty list removes every photo; a product with none gets all inserted", () => {
    expect(planImageSync(rows, [])).toEqual({ remove: ["a", "b", "c"], reorder: [], insert: [] })
    expect(planImageSync([], ["https://x/a.jpg"]).insert).toEqual([{ image_url: "https://x/a.jpg", sort_order: 0 }])
  })

  it("does not depend on the order the rows arrive in", () => {
    expect(planImageSync([...rows].reverse(), ["https://x/a.jpg", "https://x/b.jpg", "https://x/c.jpg"]).reorder).toEqual([])
  })
})
