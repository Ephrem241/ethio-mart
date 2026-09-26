import { en } from "@/locales/en"

import { admin, createTestProduct } from "./support/db"
import { expect, test } from "./support/fixtures"
import { signIn, visible, waitForAccountSync } from "./support/ui"

// Favorites (MVP definition of done: "Favorites work"): saved on this device for
// a guest, saved to the account for a signed-in customer, and not lost when the
// page is reloaded before the save reached the server.
test.describe("Favorites", () => {
  const rows = (userId: string, productId: string) => async () =>
    (await admin().from("favorites").select("product_id").eq("user_id", userId).eq("product_id", productId)).data ?? []

  test("a signed-in customer saves, sees and removes a favorite, and it is kept in the account", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 8 })
    const saved = rows(shopper.id, product.id)

    await signIn(page, shopper)
    await page.goto(`/product/${product.slug}`)
    await visible(page.getByRole("button", { name: en.product.favorites.add })).first().click()
    await expect(page.getByText(en.product.favorites.added).first()).toBeVisible()
    await expect.poll(async () => (await saved()).length, { timeout: 20_000 }).toBe(1)

    // Still saved after a reload (now the heart offers to remove it) ...
    await page.reload()
    await expect(visible(page.getByRole("button", { name: en.product.favorites.remove })).first()).toBeVisible()

    // ... and listed on the favorites page.
    await page.goto("/account/favorites")
    await expect(page.locator("main")).toContainText(product.name_en)

    // Removing it takes it out of the account too.
    await page.goto(`/product/${product.slug}`)
    await visible(page.getByRole("button", { name: en.product.favorites.remove })).first().click()
    await expect(page.getByText(en.product.favorites.removed).first()).toBeVisible()
    await expect.poll(async () => (await saved()).length, { timeout: 20_000 }).toBe(0)
    await page.goto("/account/favorites")
    await expect(page.locator("main")).not.toContainText(product.name_en)
  })

  test("a guest's favorite stays on this device, and joins the account on sign-in", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 8 })

    await page.goto(`/product/${product.slug}`)
    await visible(page.getByRole("button", { name: en.product.favorites.add })).first().click()
    await expect(page.getByText(en.product.favorites.added).first()).toBeVisible()
    await page.reload()
    await expect(visible(page.getByRole("button", { name: en.product.favorites.remove })).first()).toBeVisible()

    await signIn(page, shopper)
    await expect.poll(async () => (await rows(shopper.id, product.id)()).length, { timeout: 30_000 }).toBe(1)
  })

  test("a guest's favorite is not lost when the server cannot save it while they sign in", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 8 })
    const saved = rows(shopper.id, product.id)

    await page.goto(`/product/${product.slug}`)
    await visible(page.getByRole("button", { name: en.product.favorites.add })).first().click()
    await expect(page.getByText(en.product.favorites.added).first()).toBeVisible()

    const saves = "**/rest/v1/favorites*"
    await page.route(saves, (route) => (route.request().method() === "GET" ? route.continue() : route.abort()))
    const refused = page.waitForEvent("requestfailed", (request) => request.url().includes("/rest/v1/favorites") && request.method() === "POST")
    await signIn(page, shopper)
    await refused
    await page.unroute(saves)
    expect(await saved()).toHaveLength(0)

    await page.goto("/account/favorites")
    await expect(page.locator("main")).toContainText(product.name_en)
    await expect.poll(async () => (await saved()).length, { timeout: 20_000 }).toBe(1)
  })

  test("a favorite saved just before a reload is not lost when the server missed it", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 8 })
    const saved = rows(shopper.id, product.id)

    await signIn(page, shopper)
    await page.goto(`/product/${product.slug}`)
    await waitForAccountSync(page, "favorites")

    const saves = "**/rest/v1/favorites*"
    await page.route(saves, (route) => (route.request().method() === "GET" ? route.continue() : route.abort()))
    const refused = page.waitForEvent("requestfailed", (request) => request.url().includes("/rest/v1/favorites") && request.method() === "POST")
    await visible(page.getByRole("button", { name: en.product.favorites.add })).first().click()
    await refused
    await page.unroute(saves)
    expect(await saved()).toHaveLength(0) // the server really did miss it

    await page.goto("/account/favorites")
    await expect.poll(async () => (await saved()).length, { timeout: 20_000 }).toBe(1) // sent again by the new page
    await page.reload()
    await expect(page.locator("main")).toContainText(product.name_en)
  })
})
