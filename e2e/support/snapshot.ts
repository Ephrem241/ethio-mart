import { existsSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { admin } from "./db"

// The catalog as it was before a run. Written by global-setup, put back and
// deleted by global-teardown. If a run is killed the file is still there, so
// the next run's setup restores from it FIRST (before taking a new snapshot);
// otherwise it would treat the changed values as the originals.
export const SNAPSHOT_FILE = path.join(tmpdir(), "ethio-mart-e2e", "catalog-snapshot.json")

interface ProductSnapshot {
  id: string
  price: number
  stock: number
  is_active: boolean
  compare_at_price: number | null
}

/** Puts back any real product a test changed (stock after an order, price/stock after an admin edit); returns how many. */
export async function restoreCatalogFromSnapshot(): Promise<number> {
  if (!existsSync(SNAPSHOT_FILE)) return 0

  const before = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8")) as ProductSnapshot[]
  const { data: now } = await admin().from("products").select("id, price, stock, is_active, compare_at_price")
  const current = new Map((now ?? []).map((p) => [p.id as string, p]))

  let restored = 0
  for (const original of before) {
    const live = current.get(original.id)
    if (
      live &&
      (Number(live.price) !== Number(original.price) ||
        live.stock !== original.stock ||
        live.is_active !== original.is_active ||
        (live.compare_at_price == null ? null : Number(live.compare_at_price)) !== (original.compare_at_price == null ? null : Number(original.compare_at_price)))
    ) {
      await admin()
        .from("products")
        .update({ price: original.price, stock: original.stock, is_active: original.is_active, compare_at_price: original.compare_at_price })
        .eq("id", original.id)
      restored++
    }
  }
  rmSync(SNAPSHOT_FILE, { force: true })
  return restored
}
