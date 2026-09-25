import { en } from "@/locales/en"

import { admin, clientFor, createTestProduct, deliveryFee, freeDeliveryThreshold } from "./support/db"
import { expect, test } from "./support/fixtures"
import { addToCartButton, etb, fillDelivery, searchFor, signIn, visible, waitForHydration } from "./support/ui"

// FLOW 2 — Customer: Register → Browse → Add to cart → Checkout → Place order → Order page
test.describe("Flow 2: a new customer's first order", () => {
  test("registers, finds a product, checks out and can open the order", async ({ page, browser, newAccount, stranger, problems }) => {
    // A product of our own (priced under the free-delivery limit), so a real product's stock is never touched.
    const product = await createTestProduct({ price: 300, stock: 8 })
    const fee = await deliveryFee("Adama")
    const threshold = await freeDeliveryThreshold()
    test.skip(threshold !== null && 300 > threshold, "the free-delivery limit is below the test product's price")

    await test.step("registers with the sign-up form and lands in the account", async () => {
      await page.goto("/register")
      await waitForHydration(page)
      const main = page.locator("main")
      await main.getByLabel(en.auth.fields.fullName, { exact: true }).fill(newAccount.fullName)
      await main.getByLabel(en.auth.fields.email, { exact: true }).fill(newAccount.email)
      await main.getByLabel(en.auth.fields.password, { exact: true }).fill(newAccount.password)
      await main.getByRole("button", { name: en.auth.register.submit, exact: true }).click()
      await page.waitForURL(/\/account/)
      const { data: profile } = await admin().from("profiles").select("role, full_name").eq("email", newAccount.email).single()
      expect(profile).toEqual({ role: "customer", full_name: newAccount.fullName })
    })

    await test.step("browses the shop and finds the product", async () => {
      await page.goto("/shop")
      await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible()
      await searchFor(page, product.name_en)
      await page.locator("main").getByRole("link").filter({ hasText: product.name_en }).first().click()
      await expect(page).toHaveURL(`/product/${product.slug}`)
    })

    await test.step("adds it to the cart and goes to checkout", async () => {
      await addToCartButton(page).click()
      await expect(page.getByText(en.product.addedToCart)).toBeVisible()
      await page.goto("/cart")
      await expect(page.locator("main")).toContainText(product.name_en)
      await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
      await expect(page).toHaveURL(/\/checkout$/)
    })

    await test.step("the checkout previews the delivery fee the database will charge", async () => {
      await fillDelivery(page)
      const review = page.locator("main")
      await expect(review).toContainText(etb(300))
      await expect(review).toContainText(etb(fee))
      await expect(review).toContainText(etb(300 + fee))
    })

    let orderId = ""
    await test.step("places the order and lands on the confirmation", async () => {
      await page.locator("main").getByRole("button", { name: en.checkout.review.place, exact: true }).click()
      await page.waitForURL(/\/order\/success\/[0-9a-f-]{36}$/)
      orderId = page.url().split("/").pop()!
      await expect(page.locator("main")).toContainText(en.order.success.title)
      await expect(page.locator("main")).toContainText(/ETM-\d{8}-[A-Z0-9]{4}/)
      await expect(page.locator("main")).toContainText(en.checkout.payment.codLabel)
    })

    await test.step("what the DATABASE recorded: priced by the server, stock lowered, cart emptied", async () => {
      const { data: order } = await admin().from("orders").select("*").eq("id", orderId).single()
      expect(order).toMatchObject({ status: "pending", payment_method: "cod", payment_status: "pending" })
      expect(Number(order.subtotal)).toBe(300)
      expect(Number(order.delivery_fee)).toBe(fee)
      expect(Number(order.total)).toBe(300 + fee)
      expect(order.delivery_address).toMatchObject({ city: "Adama", full_name: "E2E Buyer", notes: "Call on arrival" })
      const { data: items } = await admin().from("order_items").select("product_id, product_name, quantity, unit_price, total").eq("order_id", orderId)
      expect(items).toHaveLength(1)
      expect(items![0]).toMatchObject({ product_id: product.id, product_name: product.name_en, quantity: 1 }) // the name is a snapshot
      expect(Number(items![0].unit_price)).toBe(300)
      expect(Number(items![0].total)).toBe(300)
      const { data: after } = await admin().from("products").select("stock").eq("id", product.id).single()
      expect(after!.stock).toBe(7)
      const { data: cart } = await admin().from("cart_items").select("id").eq("user_id", order.user_id)
      expect(cart).toEqual([])
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ethio-mart-cart") ?? "{}").state?.items)).toEqual([])
    })

    await test.step("opens the order page from the confirmation", async () => {
      await page.locator("main").getByRole("link", { name: en.order.success.track }).click()
      await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`))
      const main = page.locator("main")
      await expect(main.getByRole("heading", { level: 1 })).toContainText(/Order #ETM-/)
      await expect(main).toContainText(product.name_en)
      await expect(main).toContainText("Adama")
      await expect(main).toContainText(etb(300 + fee))
      await expect(main).toContainText(en.order.status.pending)
    })

    await test.step("another customer cannot open it, and the database won't show it to them", async () => {
      const context = await browser.newContext()
      const otherPage = await context.newPage()
      await signIn(otherPage, stranger)
      await otherPage.goto(`/orders/${orderId}`)
      await expect(otherPage.locator("main")).toContainText(en.order.notFound)
      const { data } = await (await clientFor(stranger)).from("orders").select("id").eq("id", orderId)
      expect(data).toEqual([])
      await context.close()
    })

    expect(problems.errors).toEqual([])
  })

  test("delivery is free when the order is over the free-delivery limit, as advertised", async ({ page, shopper }) => {
    const threshold = await freeDeliveryThreshold()
    test.skip(threshold === null, "no free-delivery limit is configured")
    const product = await createTestProduct({ price: (threshold as number) + 100, stock: 3 })
    // the cart is kept on the server for a signed-in customer, so put it there and let the sign-in load it
    await admin().from("cart_items").insert({ user_id: shopper.id, product_id: product.id, quantity: 1 })

    await signIn(page, shopper)
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en) // the server-side cart has loaded
    await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await fillDelivery(page)
    const main = page.locator("main")
    await expect(main).toContainText(product.name_en)
    await expect(main).toContainText(en.cart.summary.free)

    await main.getByRole("button", { name: en.checkout.review.place, exact: true }).click()
    await page.waitForURL(/\/order\/success\//)
    const orderId = page.url().split("/").pop()!
    const { data: order } = await admin().from("orders").select("subtotal, delivery_fee, total").eq("id", orderId).single()
    expect(Number(order!.delivery_fee)).toBe(0)
    expect(Number(order!.total)).toBe(Number(order!.subtotal))
  })

  test("the cart and checkout show exactly what the shop sells, at today's price", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 5 })
    await admin().from("cart_items").insert({ user_id: shopper.id, product_id: product.id, quantity: 2 })
    // the price changes after it went into the cart: the customer must be charged the CURRENT price
    await admin().from("products").update({ price: 350 }).eq("id", product.id)

    await signIn(page, shopper)
    await page.goto("/cart")
    await expect(visible(page.locator("main").getByText(etb(700)))).toBeVisible()
    await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await fillDelivery(page)
    await page.locator("main").getByRole("button", { name: en.checkout.review.place, exact: true }).click()
    await page.waitForURL(/\/order\/success\//)
    const { data: order } = await admin().from("orders").select("subtotal").eq("id", page.url().split("/").pop()!).single()
    expect(Number(order!.subtotal)).toBe(700)
  })
})
