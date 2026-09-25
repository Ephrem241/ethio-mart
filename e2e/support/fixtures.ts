import { test as base, expect } from "@playwright/test"

import { createTestUser, deleteTestUser, findTestUserByEmail, stockedProducts, testEmail, testPassword, type CatalogProduct, type TestUser } from "./db"
import { watchProblems, type Problems } from "./ui"

// Each test gets what it needs already made, and it is removed afterwards
// (whether the test passed or not; global-teardown sweeps up anything missed).
interface Fixtures {
  /** A fresh customer account. */
  shopper: TestUser
  /** A second customer, for "someone else must not see this" checks. */
  stranger: TestUser
  /** A fresh administrator account. */
  adminUser: TestUser
  /** Credentials for an account the test will create itself through the sign-up form (removed afterwards). */
  newAccount: { email: string; password: string; fullName: string }
  /** Three real, well-stocked products, cheapest first. */
  catalog: CatalogProduct[]
  /** Script errors and failed requests seen while the test ran; the test decides what to assert. */
  problems: Problems
}

export const test = base.extend<Fixtures>({
  // Playwright requires a destructured first argument, even an empty one.
  shopper: async ({}, provide) => {
    const user = await createTestUser({ tag: "shopper" })
    await provide(user)
    await deleteTestUser(user.id)
  },
  stranger: async ({}, provide) => {
    const user = await createTestUser({ tag: "stranger" })
    await provide(user)
    await deleteTestUser(user.id)
  },
  adminUser: async ({}, provide) => {
    const user = await createTestUser({ tag: "admin", role: "admin" })
    await provide(user)
    await deleteTestUser(user.id)
  },
  newAccount: async ({}, provide) => {
    const account = { email: testEmail("signup"), password: testPassword(), fullName: "E2E Signup" }
    await provide(account)
    const created = await findTestUserByEmail(account.email)
    if (created) await deleteTestUser(created.id)
  },
  catalog: async ({}, provide) => {
    await provide(await stockedProducts(3))
  },
  problems: async ({ page }, provide) => {
    await provide(watchProblems(page))
  },
})

export { expect }
