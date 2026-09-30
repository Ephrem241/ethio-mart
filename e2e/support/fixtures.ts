import { test as base, expect, type Browser, type BrowserContext } from "@playwright/test"

import { DEAL_POPUP_SESSION_KEY } from "@/lib/deal-popup"

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

// The homepage's deal popup opens by itself a few seconds after load, as a
// modal (the rest of the page is hidden from the accessibility tree while it
// is open). Specs that are about something else must not race it, so every
// browser context starts with it marked as "already shown this session" —
// including contexts a spec opens itself with browser.newContext(). A context
// that sets localStorage["e2e-deal-popup"] = "live" (deal-popup.spec.ts) gets
// the real behaviour.
export const LIVE_DEAL_POPUP_FLAG = "e2e-deal-popup"

async function quietDealPopup(context: BrowserContext) {
  await context.addInitScript(
    ([key, flag]) => {
      try {
        if (window.localStorage.getItem(flag) !== "live") window.sessionStorage.setItem(key, "1")
      } catch {}
    },
    [DEAL_POPUP_SESSION_KEY, LIVE_DEAL_POPUP_FLAG] as const
  )
}

export const test = base.extend<Fixtures, { browser: Browser }>({
  browser: [
    async ({ browser }, provide) => {
      const newContext = browser.newContext.bind(browser)
      browser.newContext = async (...args) => {
        const context = await newContext(...args)
        await quietDealPopup(context)
        return context
      }
      await provide(browser)
      browser.newContext = newContext
    },
    { scope: "worker" },
  ],
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
