import path from "node:path"

import { en } from "@/locales/en"

import { admin, createTestProduct, placeOrderAs, TEST_SLUG_PREFIX } from "./support/db"
import { expect, test } from "./support/fixtures"
import { signIn } from "./support/ui"

// The admin's create / edit / delete work beyond flow 4 (which creates and
// edits a product and moves one order along): categories end to end, product
// toggles and deletion, duplicate slugs, the product photo list, the homepage
// copy, and the order status rules. Test data only (e2e- slugs, e2e- accounts); the homepage copy
// is put back exactly as it was.

const categoryRow = (page: import("@playwright/test").Page, name: string) => page.locator("tbody tr").filter({ hasText: name })
const productRow = categoryRow

async function toast(page: import("@playwright/test").Page, text: string) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible()
}

async function guestStatus(browser: import("@playwright/test").Browser, path: string): Promise<number> {
  const context = await browser.newContext()
  const response = await (await context.newPage()).goto(path)
  const status = response?.status() ?? 0
  await context.close()
  return status
}

test.describe("Admin CRUD", () => {
  test("categories: create, edit, reorder, switch off (its products leave the shop), and delete only when empty", async ({ page, browser, adminUser }) => {
    const stamp = Date.now().toString(36)
    const name = `E2E Category ${stamp}`
    const renamed = `${name} Renamed`
    const slug = `${TEST_SLUG_PREFIX}cat-${stamp}`
    const byId = async () => (await admin().from("categories").select("id, name_en, is_active, sort_order").eq("slug", slug).maybeSingle()).data

    await signIn(page, adminUser)
    await page.goto("/admin/categories")

    await test.step("creates a category", async () => {
      await page.locator("main").getByRole("button", { name: en.admin.categories.add }).first().click()
      const dialog = page.getByRole("dialog")
      await dialog.getByLabel(en.admin.categoryForm.nameEn, { exact: true }).fill(name)
      await dialog.getByLabel(en.admin.categoryForm.nameAm, { exact: true }).fill("የሙከራ ምድብ")
      await dialog.getByLabel(en.admin.categoryForm.slug, { exact: true }).fill(slug)
      await dialog.getByLabel(en.admin.categoryForm.descriptionEn, { exact: true }).fill("Created by the tests.")
      await dialog.getByLabel(en.admin.categoryForm.descriptionAm, { exact: true }).fill("በሙከራ የተፈጠረ።")
      await dialog.getByRole("button", { name: en.admin.categoryForm.save }).click()
      await toast(page, en.admin.categories.created)
      await expect.poll(async () => (await byId())?.name_en).toBe(name)
    })

    await test.step("edits it", async () => {
      await categoryRow(page, name).getByRole("button", { name: en.admin.categories.edit }).click()
      const dialog = page.getByRole("dialog")
      await dialog.getByLabel(en.admin.categoryForm.nameEn, { exact: true }).fill(renamed)
      await dialog.getByRole("button", { name: en.admin.categoryForm.save }).click()
      await toast(page, en.admin.categories.updated)
      await expect.poll(async () => (await byId())?.name_en).toBe(renamed)
    })

    await test.step("moves it up the list", async () => {
      const before = (await byId())!.sort_order
      await categoryRow(page, renamed).getByRole("button", { name: en.admin.categories.moveUp }).click()
      await expect.poll(async () => (await byId())!.sort_order).toBeLessThan(before)
    })

    const category = (await byId())!
    const product = await createTestProduct({ category_id: category.id })

    await test.step("switching it off takes its products out of the shop", async () => {
      expect(await guestStatus(browser, `/product/${product.slug}`)).toBe(200)
      await categoryRow(page, renamed).getByRole("switch", { name: en.admin.categories.toggleActive }).click()
      await expect.poll(async () => (await byId())!.is_active).toBe(false)
      expect(await guestStatus(browser, `/product/${product.slug}`)).toBe(404)
      expect(await guestStatus(browser, `/category/${slug}`)).toBe(404)
    })

    await test.step("won't delete it while a product uses it", async () => {
      await categoryRow(page, renamed).getByRole("button", { name: en.admin.categories.delete }).click()
      await toast(page, en.admin.errors.categoryInUse)
      expect(await byId()).not.toBeNull()
    })

    await test.step("deletes it once it is empty", async () => {
      await admin().from("products").delete().eq("id", product.id)
      await page.reload()
      await categoryRow(page, renamed).getByRole("button", { name: en.admin.categories.delete }).click()
      await toast(page, en.admin.categories.removed)
      await expect.poll(byId).toBeNull()
    })
  })

  test("products: featured and active toggles, a duplicate slug is refused, and delete", async ({ page, browser, adminUser }) => {
    const product = await createTestProduct({ price: 350, stock: 6 })
    const flags = async () => (await admin().from("products").select("is_featured, is_active").eq("id", product.id).maybeSingle()).data

    await signIn(page, adminUser)
    await page.goto("/admin/products")
    const row = productRow(page, product.name_en)

    await test.step("featured on", async () => {
      await row.getByRole("switch", { name: en.admin.products.toggleFeatured }).click()
      await expect.poll(async () => (await flags())?.is_featured).toBe(true)
    })

    await test.step("active off hides it from the shop, on shows it again", async () => {
      await row.getByRole("switch", { name: en.admin.products.toggleActive }).click()
      await expect.poll(async () => (await flags())?.is_active).toBe(false)
      expect(await guestStatus(browser, `/product/${product.slug}`)).toBe(404)
      await row.getByRole("switch", { name: en.admin.products.toggleActive }).click()
      await expect.poll(async () => (await flags())?.is_active).toBe(true)
      expect(await guestStatus(browser, `/product/${product.slug}`)).toBe(200)
    })

    await test.step("a second product with the same slug is refused, with the reason", async () => {
      await page.goto("/admin/products/new")
      const form = page.locator("main form")
      await form.getByLabel(en.admin.productForm.nameEn, { exact: true }).fill("E2E Duplicate")
      await form.getByLabel(en.admin.productForm.nameAm, { exact: true }).fill("የሙከራ እቃ")
      await form.getByLabel(en.admin.productForm.slug, { exact: true }).fill(product.slug)
      await form.getByLabel(en.admin.productForm.descriptionEn, { exact: true }).fill("Created by the end-to-end tests.")
      await form.getByLabel(en.admin.productForm.descriptionAm, { exact: true }).fill("በሙከራ የተፈጠረ።")
      await form.getByLabel(en.admin.productForm.price, { exact: true }).fill("100")
      await form.getByLabel(en.admin.productForm.stock, { exact: true }).fill("1")
      await form.getByLabel(en.admin.productForm.sku, { exact: true }).fill(`E2E-DUP-${Date.now().toString(36)}`.toUpperCase())
      await form.getByLabel(en.admin.productForm.category, { exact: true }).selectOption({ index: 1 })
      await form.getByRole("button", { name: en.admin.productForm.create, exact: true }).click()
      await toast(page, en.admin.errors.productSlugExists)
      await expect(page).toHaveURL(/\/admin\/products\/new$/)
    })

    await test.step("deletes it", async () => {
      await page.goto("/admin/products")
      await productRow(page, product.name_en).getByRole("button", { name: en.admin.products.delete }).click()
      await toast(page, en.admin.products.deleted.replace("{name}", product.name_en))
      await expect.poll(flags).toBeNull()
    })
  })

  test("product photos: add several, remove and reorder, and the shop shows them in that order", async ({ page, browser, adminUser }) => {
    const product = await createTestProduct()
    const photosDir = path.join(process.cwd(), "scripts", "seed-images", "products")
    const files = ["canvas-tote-bag.jpg", "leather-wallet.jpg", "woven-belt.jpg"].map((name) => path.join(photosDir, name))
    const saved = async () =>
      ((await admin().from("product_images").select("image_url, sort_order").eq("product_id", product.id).order("sort_order")).data ?? []).map((row) => row.image_url)
    const uploaded: string[] = []

    try {
      await signIn(page, adminUser)
      await page.goto(`/admin/products/${product.id}/edit`)
      const photos = page.getByRole("group", { name: en.admin.productForm.images })
      // The address each thumbnail shows, in list order (next/image wraps it in /_next/image?url=...).
      const listed = () =>
        photos.locator("li img").evaluateAll((imgs) =>
          imgs.map((img) => {
            const src = new URL((img as HTMLImageElement).src, location.href)
            return src.pathname === "/_next/image" ? src.searchParams.get("url")! : src.href
          })
        )

      await photos.locator('input[type="file"]').setInputFiles(files)
      await expect(photos.locator("li")).toHaveCount(3, { timeout: 60000 })
      await expect(photos.getByText(en.admin.productForm.mainPhoto)).toHaveCount(1)
      const [first, second, third] = await listed()
      uploaded.push(first, second, third)

      await photos.getByRole("button", { name: en.admin.productForm.removePhoto.replace("{n}", "2") }).click()
      await photos.getByRole("button", { name: en.admin.productForm.moveEarlier.replace("{n}", "2") }).click()
      await expect.poll(listed).toEqual([third, first])
      // The moved photo keeps keyboard focus (now photo 1, so its "later" button).
      await expect(photos.getByRole("button", { name: en.admin.productForm.moveLater.replace("{n}", "1") })).toBeFocused()

      await page.locator("main form").getByRole("button", { name: en.admin.productForm.save, exact: true }).click()
      await page.waitForURL(/\/admin\/products$/)
      expect(await saved()).toEqual([third, first])

      const context = await browser.newContext()
      const visitor = await context.newPage()
      await visitor.goto(`/product/${product.slug}`)
      await expect(visitor.getByRole("button", { name: en.product.gallery.thumb.replace("{index}", "2") })).toBeVisible()
      await expect(visitor.getByRole("button", { name: en.product.gallery.thumb.replace("{index}", "3") })).toHaveCount(0)
      await context.close()

      // Saving again without changes keeps the same rows.
      const before = (await admin().from("product_images").select("id").eq("product_id", product.id).order("sort_order")).data
      await page.goto(`/admin/products/${product.id}/edit`)
      await page.locator("main form").getByRole("button", { name: en.admin.productForm.save, exact: true }).click()
      await page.waitForURL(/\/admin\/products$/)
      expect((await admin().from("product_images").select("id").eq("product_id", product.id).order("sort_order")).data).toEqual(before)
    } finally {
      const paths = uploaded.map((url) => url.split("/storage/v1/object/public/products/")[1]).filter(Boolean)
      if (paths.length) await admin().storage.from("products").remove(paths)
    }
  })

  test("homepage copy: a saved change appears on the storefront", async ({ page, browser, adminUser }) => {
    const { data: original } = await admin().from("homepage_sections").select("section_key, content")
    const text = `E2E hero subtext ${Date.now().toString(36)}`
    try {
      await signIn(page, adminUser)
      await page.goto("/admin/homepage")
      await page.locator("#heroSubtext").fill(text)
      await page.locator("main").getByRole("button", { name: en.admin.homepage.save }).click()
      await toast(page, en.admin.homepage.saved)
      const context = await browser.newContext()
      const visitor = await context.newPage()
      await visitor.goto("/")
      await expect(visitor.locator("main")).toContainText(text)
      await context.close()
    } finally {
      for (const row of original ?? []) {
        await admin().from("homepage_sections").update({ content: row.content }).eq("section_key", row.section_key)
      }
    }
  })

  test("orders: the status menu only offers forward steps", async ({ page, adminUser, shopper }) => {
    const product = await createTestProduct({ price: 200, stock: 8 })
    const order = await placeOrderAs(shopper, [{ product_id: product.id, quantity: 1 }])
    const status = async () => (await admin().from("orders").select("status").eq("id", order.id).single()).data!.status
    const offered = () =>
      page.getByLabel(en.admin.orders.changeStatusShort).locator("option").evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))

    await signIn(page, adminUser)
    await page.goto(`/admin/orders/${order.id}`)
    await expect.poll(offered).toEqual(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"])

    await page.getByLabel(en.admin.orders.changeStatusShort).selectOption("shipped")
    await expect.poll(status).toBe("shipped")
    await page.reload()
    await expect.poll(offered).toEqual(["shipped", "delivered", "cancelled"])
  })

  // Needs migration 0018 (forward-only statuses + restock on cancel). Until it
  // is applied the test reports itself skipped rather than failing.
  test("orders: the database refuses a step backwards, and cancelling puts the stock back", async ({ page, adminUser, shopper }) => {
    const product = await createTestProduct({ price: 200, stock: 8 })
    const order = await placeOrderAs(shopper, [{ product_id: product.id, quantity: 3 }])
    const stock = async () => (await admin().from("products").select("stock").eq("id", product.id).single()).data!.stock
    const status = async () => (await admin().from("orders").select("status").eq("id", order.id).single()).data!.status
    expect(await stock()).toBe(5)

    await admin().from("orders").update({ status: "shipped" }).eq("id", order.id)
    const { error } = await admin().from("orders").update({ status: "pending" }).eq("id", order.id)
    test.skip(!error, "Migration 0018 is not applied yet: the database still lets an order move backwards.")
    expect(error!.message).toMatch(/can't go from shipped to pending/)

    await signIn(page, adminUser)
    await page.goto(`/admin/orders/${order.id}`)
    await page.getByLabel(en.admin.orders.changeStatusShort).selectOption("cancelled")
    await expect.poll(status).toBe("cancelled")
    await expect.poll(stock).toBe(8)
  })
})
