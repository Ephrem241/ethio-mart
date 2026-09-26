import { en } from "@/locales/en"

import { admin, createTestProduct } from "./support/db"
import { expect, test } from "./support/fixtures"
import { addToCartButton, signIn, waitForAccountSync } from "./support/ui"

// A signed-in shopper's cart is saved to the server in the background. If the
// page is reloaded (or the tab closed) before that request finishes, the server
// never hears about the item — and the next page load must not take the
// server's silence as "the shopper removed it".
test.describe("Cart saving", () => {
  test("an item added just before a reload is not lost when the server missed it", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 8 })
    const cartRows = async () =>
      (await admin().from("cart_items").select("quantity").eq("user_id", shopper.id).eq("product_id", product.id)).data ?? []

    await signIn(page, shopper)
    await page.goto(`/product/${product.slug}`)
    await waitForAccountSync(page, "cart")

    // The save request never arrives (as when the page is closed mid-request).
    const saves = "**/rest/v1/cart_items*"
    await page.route(saves, (route) => (route.request().method() === "GET" ? route.continue() : route.abort()))
    // (The save starts a moment after the click, so wait for it to be refused before letting requests through again.)
    const refused = page.waitForEvent("requestfailed", (request) => request.url().includes("/rest/v1/cart_items") && request.method() === "POST")
    await addToCartButton(page).click()
    await expect(page.getByText(en.product.addedToCart)).toBeVisible()
    await refused
    await page.unroute(saves)
    expect(await cartRows()).toHaveLength(0) // the server really did miss it

    // A full page load: the browser keeps only what is in localStorage.
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en)

    // The page notices the server is missing it and sends it again.
    await expect.poll(async () => (await cartRows()).length, { timeout: 20_000 }).toBe(1)

    // ...and it stays in the cart from then on.
    await page.reload()
    await expect(page.locator("main")).toContainText(product.name_en)
    expect(await cartRows()).toHaveLength(1)
  })

  test("a guest's cart is not lost when the server cannot save it while they sign in", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 8 })
    const cartRows = async () =>
      (await admin().from("cart_items").select("quantity").eq("user_id", shopper.id).eq("product_id", product.id)).data ?? []

    // A guest fills the cart ...
    await page.goto(`/product/${product.slug}`)
    await addToCartButton(page).click()
    await expect(page.getByText(en.product.addedToCart)).toBeVisible()

    // ... and signs in. Signing in saves the guest cart to the account, but the save is refused.
    const saves = "**/rest/v1/cart_items*"
    await page.route(saves, (route) => (route.request().method() === "GET" ? route.continue() : route.abort()))
    const refused = page.waitForEvent("requestfailed", (request) => request.url().includes("/rest/v1/cart_items") && request.method() === "POST")
    await signIn(page, shopper)
    await refused
    await page.unroute(saves)
    expect(await cartRows()).toHaveLength(0)

    // The next page load must still have the item, and send it again.
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en)
    await expect.poll(async () => (await cartRows()).length, { timeout: 20_000 }).toBe(1)
    await page.reload()
    await expect(page.locator("main")).toContainText(product.name_en)
  })
})
