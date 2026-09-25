import { existsSync, readFileSync, rmSync } from "node:fs"

import { admin, deleteAllTestUsers, deleteTestCatalog } from "./db"
import { SNAPSHOT_FILE } from "./global-setup"

interface ProductSnapshot {
  id: string
  price: number
  stock: number
  is_active: boolean
  compare_at_price: number | null
}

// Runs once after the suite (even when tests failed): removes every test
// account, order and throwaway product, and restores any real product a test
// changed (stock after an order, price/stock after an admin edit).
export default async function globalTeardown() {
  const users = await deleteAllTestUsers()
  await deleteTestCatalog()

  let restored = 0
  if (existsSync(SNAPSHOT_FILE)) {
    const before = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8")) as ProductSnapshot[]
    const { data: now } = await admin().from("products").select("id, price, stock, is_active, compare_at_price")
    const current = new Map((now ?? []).map((p) => [p.id as string, p]))
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
  }

  if (users || restored) console.log(`[e2e] cleaned up: ${users} test account(s), ${restored} product(s) restored`)
}
