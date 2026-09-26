import { deleteAllTestUsers, deleteTestCatalog } from "./db"
import { restoreCatalogFromSnapshot } from "./snapshot"

// Runs once after the suite (even when tests failed): removes every test
// account, order and throwaway product, and restores any real product a test
// changed (stock after an order, price/stock after an admin edit).
export default async function globalTeardown() {
  const users = await deleteAllTestUsers()
  await deleteTestCatalog()
  const restored = await restoreCatalogFromSnapshot()

  if (users || restored) console.log(`[e2e] cleaned up: ${users} test account(s), ${restored} product(s) restored`)
}
