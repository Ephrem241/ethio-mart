import { en } from "@/locales/en"

import { admin, createTestProduct, placeOrderAs, TEST_SLUG_PREFIX } from "./support/db"
import { expect, test } from "./support/fixtures"
import { etb, signIn } from "./support/ui"

// FLOW 4 — Admin: Login → Admin → Create product → Edit product → View order → Update order status
test.describe("Flow 4: an administrator running the shop", () => {
  test("creates and edits a product, then finds an order and moves it along", async ({ page, browser, adminUser, shopper, problems }) => {
    const stamp = Date.now().toString(36)
    const name = `E2E Admin Product ${stamp}`
    const slug = `${TEST_SLUG_PREFIX}admin-${stamp}`

    await test.step("logs in and reaches the admin dashboard", async () => {
      await signIn(page, adminUser)
      await page.goto("/admin")
      const main = page.locator("main")
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(en.admin.dashboard.title)
      for (const label of [en.admin.dashboard.todaysSales, en.admin.dashboard.monthlySales, en.admin.dashboard.totalOrders, en.admin.dashboard.totalCustomers]) {
        await expect(main).toContainText(label)
      }
      await expect(page.getByRole("navigation", { name: en.admin.nav.label }).getByRole("link")).toHaveCount(6)
    })

    await test.step("creates a product", async () => {
      await page.getByRole("navigation", { name: en.admin.nav.label }).getByRole("link", { name: en.admin.products.title }).click()
      await expect(page).toHaveURL(/\/admin\/products$/)
      await page.getByRole("link", { name: en.admin.products.add }).click()
      await expect(page).toHaveURL(/\/admin\/products\/new$/)
      const form = page.locator("main form")
      await form.getByLabel(en.admin.productForm.nameEn, { exact: true }).fill(name)
      await form.getByLabel(en.admin.productForm.nameAm, { exact: true }).fill("የሙከራ እቃ")
      await form.getByLabel(en.admin.productForm.slug, { exact: true }).fill(slug)
      await form.getByLabel(en.admin.productForm.descriptionEn, { exact: true }).fill("Created by the end-to-end tests.")
      await form.getByLabel(en.admin.productForm.descriptionAm, { exact: true }).fill("በሙከራ የተፈጠረ።")
      await form.getByLabel(en.admin.productForm.price, { exact: true }).fill("450")
      await form.getByLabel(en.admin.productForm.stock, { exact: true }).fill("12")
      await form.getByLabel(en.admin.productForm.sku, { exact: true }).fill(`E2E-ADM-${stamp}`.toUpperCase())
      await form.getByLabel(en.admin.productForm.category, { exact: true }).selectOption({ index: 1 })
      await form.getByRole("button", { name: en.admin.productForm.create, exact: true }).click()
      await page.waitForURL(/\/admin\/products$/)
      await expect(page.locator("main")).toContainText(name)
      const { data } = await admin().from("products").select("price, stock, is_active").eq("slug", slug).single()
      expect(data).toMatchObject({ stock: 12, is_active: true })
      expect(Number(data!.price)).toBe(450)
    })

    await test.step("a signed-out visitor can see the new product right away", async () => {
      const context = await browser.newContext()
      const visitor = await context.newPage()
      await visitor.goto(`/product/${slug}`)
      await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(name)
      await expect(visitor.locator("main")).toContainText(etb(450))
      await context.close()
    })

    await test.step("edits it: a new price and less stock", async () => {
      const row = page.locator("tbody tr").filter({ hasText: name })
      await row.getByRole("link", { name: en.admin.products.edit }).click()
      await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}\/edit$/)
      const form = page.locator("main form")
      await form.getByLabel(en.admin.productForm.price, { exact: true }).fill("399")
      await form.getByLabel(en.admin.productForm.stock, { exact: true }).fill("3")
      await form.getByRole("button", { name: en.admin.productForm.save, exact: true }).click()
      await page.waitForURL(/\/admin\/products$/)
      const { data } = await admin().from("products").select("price, stock").eq("slug", slug).single()
      expect(Number(data!.price)).toBe(399)
      expect(data!.stock).toBe(3)
    })

    await test.step("the shop shows the new price and the low stock", async () => {
      const context = await browser.newContext()
      const visitor = await context.newPage()
      await visitor.goto(`/product/${slug}`)
      await expect(visitor.locator("main")).toContainText(etb(399))
      await expect(visitor.locator("main")).toContainText(en.product.stock.low.replace("{count}", "3"))
      await context.close()
    })

    // an order to work with: placed by a customer, through the same function the checkout uses
    const item = await createTestProduct({ price: 300, stock: 5 })
    const order = await placeOrderAs(shopper, [{ product_id: item.id, quantity: 1 }])

    await test.step("finds the order in the order list and opens it", async () => {
      await page.getByRole("navigation", { name: en.admin.nav.label }).getByRole("link", { name: en.admin.orders.title }).click()
      await expect(page).toHaveURL(/\/admin\/orders$/)
      const row = page.locator("tbody tr").filter({ hasText: order.order_number })
      await expect(row).toContainText(shopper.fullName)
      await row.getByRole("link", { name: en.admin.orders.view }).click()
      await expect(page).toHaveURL(new RegExp(`/admin/orders/${order.id}$`))
      const main = page.locator("main")
      await expect(main.getByRole("heading", { level: 1 })).toContainText(order.order_number)
      await expect(main).toContainText(shopper.email)
      await expect(main).toContainText(item.name_en)
    })

    await test.step("moves it to Confirmed, and the timeline records it", async () => {
      const status = page.getByLabel(en.admin.orders.changeStatusShort)
      await status.selectOption("confirmed")
      await expect(page.locator("main").getByText(en.order.status.confirmed).first()).toBeVisible()
      await expect.poll(async () => (await admin().from("orders").select("status").eq("id", order.id).single()).data?.status).toBe("confirmed")
      await page.reload()
      await expect(page.locator("main section").filter({ has: page.getByRole("heading", { name: en.order.timeline.title }) })).toContainText(en.order.status.confirmed)
    })

    await test.step("cancelling is final: the status can no longer be changed", async () => {
      await page.getByLabel(en.admin.orders.changeStatusShort).selectOption("cancelled")
      await expect.poll(async () => (await admin().from("orders").select("status").eq("id", order.id).single()).data?.status).toBe("cancelled")
      await page.reload()
      await expect(page.getByLabel(en.admin.orders.changeStatusShort)).toBeDisabled()
    })

    expect(problems.errors).toEqual([])
  })
})
