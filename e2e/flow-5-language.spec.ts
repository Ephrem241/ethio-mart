import { am } from "@/locales/am"
import { en } from "@/locales/en"

import { expect, test } from "./support/fixtures"
import { switchLanguage, visible } from "./support/ui"

// FLOW 5 — Language: English → Amharic → English
test.describe("Flow 5: switching language", () => {
  test("English → Amharic → English, and the choice sticks while browsing", async ({ page, context, catalog, problems }) => {
    const product = catalog[0]

    await test.step("starts in English", async () => {
      await page.goto("/")
      await expect(page.locator("html")).toHaveAttribute("lang", "en")
      await expect(visible(page.getByRole("link", { name: en.nav.shop, exact: true }))).toBeVisible()
    })

    await test.step("switches to Amharic: the page, the html language and a cookie change", async () => {
      await switchLanguage(page, "am")
      await expect(page.locator("html")).toHaveAttribute("lang", "am")
      await expect(visible(page.getByRole("link", { name: am.nav.shop, exact: true }))).toBeVisible()
      const cookies = await context.cookies()
      expect(cookies.find((c) => c.name === "locale")?.value).toBe("am")
    })

    await test.step("stays Amharic on other pages, with product names in Amharic", async () => {
      await page.goto(`/product/${product.slug}`)
      await expect(page.locator("html")).toHaveAttribute("lang", "am")
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name_am)
      await expect(visible(page.getByRole("button", { name: am.product.addToCart, exact: true }))).toBeVisible()
      await page.goto("/cart")
      await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText(am.cart.title)
    })

    await test.step("survives a reload", async () => {
      await page.reload()
      await expect(page.locator("html")).toHaveAttribute("lang", "am")
    })

    await test.step("switches back to English", async () => {
      await switchLanguage(page, "en")
      await expect(page.locator("html")).toHaveAttribute("lang", "en")
      await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText(en.cart.title)
    })

    expect(problems.errors).toEqual([])
  })

  test("a shared link with ?lang=am opens in Amharic and remembers it", async ({ page, context }) => {
    await page.goto("/shop?lang=am")
    await expect(page.locator("html")).toHaveAttribute("lang", "am")
    await page.goto("/categories") // no ?lang this time
    await expect(page.locator("html")).toHaveAttribute("lang", "am")
    expect((await context.cookies()).find((c) => c.name === "locale")?.value).toBe("am")
  })

  test("Amharic pages are marked up for Amharic: page title, canonical/alternate links", async ({ page }) => {
    await page.goto("/shop?lang=am")
    await expect(page).toHaveTitle(new RegExp(am.catalog.shopTitle))
    const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")))
    expect(alternates).toEqual(expect.arrayContaining(["en", "am", "x-default"]))
  })

  test("a broken or unknown language value falls back to English", async ({ page }) => {
    await page.goto("/shop?lang=xx")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
  })
})
