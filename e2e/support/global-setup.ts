import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { admin, deleteAllTestUsers, deleteTestCatalog, TEST_SLUG_PREFIX } from "./db"

export const SNAPSHOT_FILE = path.join(tmpdir(), "ethio-mart-e2e", "catalog-snapshot.json")

// Runs once before the suite:
//  1. checks the environment is complete (a clear message beats a cryptic failure),
//  2. removes anything a previous, interrupted run left behind,
//  3. remembers the catalog as it is now, so the teardown can put back whatever
//     the tests change (an order lowers a product's stock).
export default async function globalSetup() {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter((name) => !process.env[name])
  if (missing.length) {
    throw new Error(`Missing ${missing.join(", ")}. Put the Supabase project's values in .env (see README, "Testing").`)
  }

  const staleUsers = await deleteAllTestUsers()
  await deleteTestCatalog()
  if (staleUsers) console.log(`[e2e] removed ${staleUsers} test account(s) left by an earlier run`)

  const { data, error } = await admin()
    .from("products")
    .select("id, price, stock, is_active, compare_at_price")
    .not("slug", "like", `${TEST_SLUG_PREFIX}%`)
  if (error || !data) throw new Error(`Could not read the catalog: ${error?.message}`)

  mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true })
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(data))
}
