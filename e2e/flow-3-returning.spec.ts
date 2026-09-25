import { en } from "@/locales/en"

import { createTestProduct, placeOrderAs } from "./support/db"
import { expect, test } from "./support/fixtures"
import { etb, signIn } from "./support/ui"

// FLOW 3 — Returning customer: Login → Account → Orders → Order details
test.describe("Flow 3: a returning customer", () => {
  test("logs in, opens their orders and reads an order's details", async ({ page, shopper, problems }) => {
    const product = await createTestProduct({ price: 300, stock: 6 })
    const order = await placeOrderAs(shopper, [{ product_id: product.id, quantity: 2 }])

    await test.step("logs in and lands in the account, which shows who they are", async () => {
      await signIn(page, shopper)
      await expect(page).toHaveURL(/\/account$/)
      await expect(page.locator("main")).toContainText(shopper.fullName)
      await expect(page.locator("main").getByLabel(en.auth.fields.email, { exact: true })).toHaveValue(shopper.email)
    })

    await test.step("opens Orders from the account menu and sees the order", async () => {
      await page.getByRole("navigation", { name: en.account.nav.label }).getByRole("link", { name: en.account.nav.orders }).click()
      await expect(page).toHaveURL(/\/account\/orders$/)
      const main = page.locator("main")
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(en.account.orders.title)
      await expect(main).toContainText(order.order_number)
      await expect(main).toContainText(en.order.status.pending)
      await expect(main).toContainText(etb(order.total))
    })

    await test.step("searching by order number narrows the list; a wrong number says so", async () => {
      const search = page.getByPlaceholder(en.account.orders.searchPlaceholder)
      await search.fill("ETM-00000000-ZZZZ")
      await expect(page.locator("main")).toContainText(en.account.orders.noMatch)
      await search.fill(order.order_number)
      await expect(page.locator("main")).toContainText(order.order_number)
      await search.fill("")
    })

    await test.step("opens the order and finds everything about it", async () => {
      await page.locator("main").getByRole("link", { name: new RegExp(order.order_number) }).first().click()
      await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`))
      const main = page.locator("main")
      await expect(main.getByRole("heading", { level: 1 })).toContainText(order.order_number)
      await expect(main).toContainText(product.name_en)
      await expect(main).toContainText(en.order.items.qtyLine.replace("{quantity}", "2").replace("{price}", etb(300)))
      await expect(main).toContainText("Adama") // the delivery address
      await expect(main).toContainText(en.checkout.payment.codLabel)
      await expect(main).toContainText(etb(order.total))
      await expect(main.getByRole("heading", { name: en.order.timeline.title })).toBeVisible()
      await expect(main).toContainText(en.order.status.pending)
    })

    await test.step("can go back to the list", async () => {
      await page.locator("main").getByRole("link", { name: en.order.back }).click()
      await expect(page).toHaveURL(/\/account\/orders$/)
    })

    expect(problems.errors).toEqual([])
  })

  test("a customer with no orders is told so, with a way to start shopping", async ({ page, shopper }) => {
    await signIn(page, shopper)
    await page.goto("/account/orders")
    const main = page.locator("main")
    await expect(main).toContainText(en.account.orders.emptyTitle)
    await expect(main.getByRole("link", { name: en.account.orders.startShopping })).toBeVisible()
  })

  test("logging out ends the session, and the account is protected again", async ({ page, shopper }) => {
    await signIn(page, shopper)
    await page.locator("main").getByRole("button", { name: en.account.nav.logout }).click()
    await expect(page.getByText(en.account.nav.loggedOut)).toBeVisible()
    await page.goto("/account")
    await expect(page).toHaveURL(/\/login\?redirect=%2Faccount/)
  })
})
