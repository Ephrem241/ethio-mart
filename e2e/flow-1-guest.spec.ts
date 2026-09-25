import { en } from "@/locales/en"

import { expect, test } from "./support/fixtures"
import { addToCartButton, etb, searchFor, visible } from "./support/ui"

// FLOW 1 — Guest: Homepage → Search → Product → Add to cart → Cart
test.describe("Flow 1: a guest shopping", () => {
  test("finds a product by searching, adds it to the cart and sees it there", async ({ page, catalog, problems }) => {
    const product = catalog[0]

    await test.step("the homepage opens with a headline", async () => {
      await page.goto("/")
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    })

    await test.step("searching finds the product", async () => {
      await searchFor(page, product.name_en.split(" ")[0])
      await expect(page).toHaveURL(/\/search\?q=/)
      await expect(page.locator("main").getByRole("link").filter({ hasText: product.name_en }).first()).toBeVisible()
    })

    await test.step("its product page shows the name and the price", async () => {
      await page.locator("main").getByRole("link").filter({ hasText: product.name_en }).first().click()
      await expect(page).toHaveURL(`/product/${product.slug}`)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name_en)
      await expect(page.locator("main")).toContainText(etb(product.price))
    })

    await test.step("adding it to the cart confirms and updates the cart count", async () => {
      await addToCartButton(page).click()
      await expect(page.getByText(en.product.addedToCart)).toBeVisible()
      await expect(visible(page.getByRole("link", { name: en.nav.cartCount.one.replace("{count}", "1") }))).toBeVisible()
    })

    await test.step("the cart lists it with the right total", async () => {
      await visible(page.getByRole("link", { name: /^Cart/ })).click()
      await expect(page).toHaveURL(/\/cart$/)
      const main = page.locator("main")
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(en.cart.title)
      await expect(main).toContainText(product.name_en)
      await expect(main).toContainText(etb(product.price))
    })

    await test.step("the cart survives a reload (it is kept on this device)", async () => {
      await page.reload()
      await expect(page.locator("main")).toContainText(product.name_en)
    })

    expect(problems.errors).toEqual([])
  })

  test("a guest who goes on to checkout is asked to log in first, with the way back remembered", async ({ page, catalog }) => {
    await page.goto(`/product/${catalog[0].slug}`)
    await addToCartButton(page).click()
    await expect(page.getByText(en.product.addedToCart)).toBeVisible()
    await page.goto("/cart")
    await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/)
  })

  test("adding the same product twice makes it quantity 2, not two lines", async ({ page, catalog }) => {
    await page.goto(`/product/${catalog[0].slug}`)
    await addToCartButton(page).click()
    await page.waitForTimeout(400)
    await addToCartButton(page).click()
    await page.goto("/cart")
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ethio-mart-cart") ?? "{}").state?.items)
    expect(stored).toHaveLength(1)
    expect(stored[0].quantity).toBe(2)
  })
})
