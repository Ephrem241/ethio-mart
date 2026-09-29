// Works out how to turn a product's saved photo rows into the list the admin
// just submitted (main photo first). A row whose photo is still in the list is
// kept and, if it moved, only gets its new position; photos no longer in the
// list are deleted and new ones inserted. Kept rows keep their ids, so a
// re-save with nothing changed writes nothing at all.

export interface ImageRow {
  id: string
  image_url: string
  sort_order: number
}

export interface ImageSyncPlan {
  remove: string[] // row ids
  reorder: { id: string; sort_order: number }[]
  insert: { image_url: string; sort_order: number }[]
}

export const MAX_PRODUCT_IMAGES = 8

export function planImageSync(existing: ImageRow[], urls: string[]): ImageSyncPlan {
  const unused = [...existing].sort((a, b) => a.sort_order - b.sort_order)
  const plan: ImageSyncPlan = { remove: [], reorder: [], insert: [] }

  urls.forEach((url, position) => {
    // The same photo listed twice keeps one row per listing.
    const at = unused.findIndex((row) => row.image_url === url)
    if (at === -1) {
      plan.insert.push({ image_url: url, sort_order: position })
      return
    }
    const [row] = unused.splice(at, 1)
    if (row.sort_order !== position) plan.reorder.push({ id: row.id, sort_order: position })
  })

  plan.remove = unused.map((row) => row.id)
  return plan
}
