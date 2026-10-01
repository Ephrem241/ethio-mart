import { en } from "@/locales/en"

import { expect, test } from "./support/fixtures"
import { signIn, visible, waitForHydration } from "./support/ui"

// How an admin reaches the admin area: signing in lands there, and the
// account menu links to it. Customers see neither.
test.describe("Admin access", () => {
  test("an admin lands in the admin after signing in, and the account menu leads back to it", async ({ page, adminUser }) => {
    await signIn(page, adminUser, /\/admin$/)
    await expect(page.getByRole("heading", { level: 1, name: en.admin.dashboard.title })).toBeVisible()

    await page.goto("/account")
    const link = visible(page.getByRole("navigation", { name: en.account.nav.label }).getByRole("link", { name: en.account.nav.admin }))
    await link.click()
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole("heading", { level: 1, name: en.admin.dashboard.title })).toBeVisible()
  })

  test("a page the admin asked for still wins over the admin landing", async ({ page, adminUser }) => {
    await page.goto("/login?redirect=%2Faccount%2Forders")
    await waitForHydration(page)
    const main = page.locator("main")
    await main.getByLabel(en.auth.fields.email, { exact: true }).fill(adminUser.email)
    await main.getByLabel(en.auth.fields.password, { exact: true }).fill(adminUser.password)
    await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
    await expect(page).toHaveURL(/\/account\/orders$/)
  })

  test("a customer stays in their account, sees no admin link, and can't open the admin", async ({ page, shopper }) => {
    await signIn(page, shopper, /\/account$/)
    await expect(page.getByRole("link", { name: en.account.nav.admin })).toHaveCount(0)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/$/)
  })
})
