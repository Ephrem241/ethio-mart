import { en } from "@/locales/en"

import { admin, anonymousClient, clientFor, createTestProduct, DELIVERY_ADDRESS, placeOrderAs } from "./support/db"
import { expect, test } from "./support/fixtures"
import { addToCartButton, fillDelivery, signIn, visible, waitForHydration } from "./support/ui"

// "Every state needs a useful UI." The ten error states from the plan (section 83):
// no internet, invalid login, invalid checkout, empty cart, out of stock, invalid
// product, invalid category, unauthorized admin access, database failure, image failure.

const notFoundHeading = (page: import("@playwright/test").Page) => page.locator("main").getByRole("heading", { level: 1 })

test.describe("1. No internet", () => {
  test("a guest's cart keeps working with the connection down", async ({ page, context, catalog }) => {
    await page.goto(`/product/${catalog[0].slug}`)
    await context.setOffline(true)
    await addToCartButton(page).click()
    await expect(page.getByText(en.product.addedToCart)).toBeVisible()
    await expect(visible(page.getByRole("link", { name: en.nav.cartCount.one.replace("{count}", "1") }))).toBeVisible()
    await context.setOffline(false)
  })

  test("placing an order while offline explains the problem, allows a retry, and never orders twice", async ({ page, context, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 5 })
    await admin().from("cart_items").insert({ user_id: shopper.id, product_id: product.id, quantity: 1 })
    await signIn(page, shopper)
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en)
    await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
    await fillDelivery(page)

    await context.setOffline(true)
    const place = page.locator("main").getByRole("button", { name: en.checkout.review.place, exact: true })
    await place.click()
    // The client retries a failed read a few times before giving up (about 7 seconds), then the shopper is told.
    await expect(page.locator("main").getByRole("alert")).toHaveText(en.errors.network, { timeout: 45_000 })
    await expect(place).toBeEnabled() // not stuck on "Placing order..."
    expect((await admin().from("orders").select("id").eq("user_id", shopper.id)).data).toEqual([]) // nothing was ordered

    await context.setOffline(false)
    await place.click()
    await page.waitForURL(/\/order\/success\//)
    expect((await admin().from("orders").select("id").eq("user_id", shopper.id)).data).toHaveLength(1)
  })
})

test.describe("2. Invalid login", () => {
  test("a wrong password and an unknown e-mail get the same message, and the visitor stays on the form", async ({ page, shopper }) => {
    for (const credentials of [
      { email: shopper.email, password: "Definitely-the-wrong-1!" },
      { email: `nobody-${Date.now()}@example.com`, password: "Whatever-123!" },
    ]) {
      await page.goto("/login")
      await waitForHydration(page)
      const main = page.locator("main")
      await main.getByLabel(en.auth.fields.email, { exact: true }).fill(credentials.email)
      await main.getByLabel(en.auth.fields.password, { exact: true }).fill(credentials.password)
      await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
      await expect(main.getByRole("alert")).toHaveText(en.auth.errors.invalidCredentials)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test("empty and malformed fields are explained field by field", async ({ page }) => {
    await page.goto("/login")
    await waitForHydration(page)
    const main = page.locator("main")
    await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
    await expect(main.getByLabel(en.auth.fields.email, { exact: true })).toHaveAttribute("aria-invalid", "true")
    await expect(main).toContainText(en.validation.email)
    await expect(main).toContainText(en.auth.validation.passwordRequired)
    await main.getByLabel(en.auth.fields.email, { exact: true }).fill("not-an-email")
    await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
    await expect(main).toContainText(en.validation.email)
  })

  test("a ?redirect= that points at another site is ignored after logging in", async ({ page, shopper }) => {
    for (const evil of ["https://evil.example/steal", "//evil.example", "/\\evil.example", "/\t/evil.example"]) {
      await page.goto(`/login?redirect=${encodeURIComponent(evil)}`)
      await waitForHydration(page)
      const main = page.locator("main")
      await main.getByLabel(en.auth.fields.email, { exact: true }).fill(shopper.email)
      await main.getByLabel(en.auth.fields.password, { exact: true }).fill(shopper.password)
      await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
      await page.waitForURL(/\/account/)
      expect(new URL(page.url()).origin).toBe(new URL(page.url().replace(/\/account.*/, "")).origin)
      expect(page.url()).not.toContain("evil.example")
      await page.context().clearCookies()
      await page.evaluate(() => localStorage.clear())
    }
  })
})

test.describe("3. Invalid checkout", () => {
  test("submitting an empty or wrong form names each problem and orders nothing", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 5 })
    await admin().from("cart_items").insert({ user_id: shopper.id, product_id: product.id, quantity: 1 })
    await signIn(page, shopper)
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en)
    await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
    await waitForHydration(page)

    const place = page.locator("main").getByRole("button", { name: en.checkout.review.place, exact: true })
    await place.click()
    const main = page.locator("main")
    for (const message of [en.checkout.validation.fullName, en.validation.phone, en.checkout.validation.city, en.checkout.validation.subCity, en.checkout.validation.woreda, en.checkout.validation.address]) {
      await expect(main).toContainText(message)
    }
    await main.getByLabel(en.checkout.delivery.phone, { exact: true }).fill("12345")
    await place.click()
    await expect(main).toContainText(en.validation.phone)
    expect((await admin().from("orders").select("id").eq("user_id", shopper.id)).data).toEqual([])
  })

  test("the database itself refuses what the page would never send (a tampered or bypassed checkout)", async ({ shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 2 })
    const client = await clientFor(shopper)
    const place = (over: object) => client.rpc("place_order", { p_delivery_address: DELIVERY_ADDRESS, p_payment_method: "cod", p_items: [{ product_id: product.id, quantity: 1 }], ...over })

    expect((await place({ p_items: [{ product_id: product.id, quantity: 0 }] })).error?.message).toMatch(/Invalid quantity/i)
    expect((await place({ p_items: [{ product_id: product.id, quantity: -3 }] })).error?.message).toMatch(/Invalid quantity/i)
    expect((await place({ p_items: [{ product_id: product.id, quantity: 3 }] })).error?.message).toMatch(/Not enough stock/i)
    expect((await place({ p_items: [] })).error?.message).toMatch(/cart is empty/i)
    expect((await place({ p_payment_method: "manual" })).error?.message).toMatch(/isn't available/i)
    expect((await place({ p_delivery_address: { city: "Adama" } })).error?.message).toMatch(/incomplete/i)
    expect((await place({ p_items: [{ product_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }] })).error?.message).toMatch(/no longer available/i)

    const signedOut = await anonymousClient().rpc("place_order", { p_delivery_address: DELIVERY_ADDRESS, p_payment_method: "cod", p_items: [{ product_id: product.id, quantity: 1 }] })
    expect(signedOut.error).not.toBeNull() // a visitor who isn't signed in cannot order at all

    expect((await admin().from("orders").select("id").eq("user_id", shopper.id)).data).toEqual([]) // none of that created an order
    expect((await admin().from("products").select("stock").eq("id", product.id).single()).data?.stock).toBe(2) // and none of it touched stock
  })
})

test.describe("4. Empty cart", () => {
  test("a guest's empty cart says so and points to the shop", async ({ page }) => {
    await page.goto("/cart")
    const main = page.locator("main")
    await expect(main).toContainText(en.cart.emptyTitle)
    await main.getByRole("link", { name: en.cart.startShopping }).click()
    await expect(page).toHaveURL(/\/shop$/)
  })

  test("checking out with nothing in the cart is explained, not a blank page", async ({ page, shopper }) => {
    await signIn(page, shopper)
    await page.goto("/checkout")
    await expect(page.locator("main")).toContainText(en.cart.emptyTitle)
  })

  test("removing the last item from the cart shows the empty state", async ({ page, catalog }) => {
    await page.goto(`/product/${catalog[0].slug}`)
    await addToCartButton(page).click()
    await page.goto("/cart")
    await page.getByRole("button", { name: en.cart.removeItem.replace("{name}", catalog[0].name_en) }).click()
    await expect(page.locator("main")).toContainText(en.cart.emptyTitle)
  })
})

test.describe("5. Out of stock", () => {
  test("a sold-out product says so and cannot be added to the cart", async ({ page }) => {
    const product = await createTestProduct({ stock: 0 })
    await page.goto(`/product/${product.slug}`)
    await expect(page.locator("main")).toContainText(en.product.stock.out)
    await expect(page.getByRole("button", { name: en.product.addToCart, exact: true }).filter({ visible: true })).toHaveCount(0)
  })

  test("when stock drops after an item is in the cart, checkout warns and blocks the order", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 5 })
    await admin().from("cart_items").insert({ user_id: shopper.id, product_id: product.id, quantity: 3 })
    await signIn(page, shopper)
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en)
    await admin().from("products").update({ stock: 1 }).eq("id", product.id) // someone else bought it meanwhile
    await page.locator("main").getByRole("link", { name: en.cart.summary.continue }).click()
    await fillDelivery(page)
    const main = page.locator("main")
    await expect(main).toContainText(en.checkout.review.insufficientStock.replace("{names}", product.name_en))
    await expect(main.getByRole("button", { name: en.checkout.review.place, exact: true })).toBeDisabled()
  })

  test("if the last unit is taken while a customer is on the checkout page, the database refuses the order and nothing is oversold", async ({ shopper, stranger }) => {
    const product = await createTestProduct({ price: 300, stock: 1 })
    await placeOrderAs(stranger, [{ product_id: product.id, quantity: 1 }]) // the last one is gone
    await expect(placeOrderAs(shopper, [{ product_id: product.id, quantity: 1 }])).rejects.toThrow(/Not enough stock/i)
    expect((await admin().from("products").select("stock").eq("id", product.id).single()).data?.stock).toBe(0) // never negative
  })
})

test.describe("6 and 7. Invalid product and invalid category", () => {
  for (const [what, urlPath] of [
    ["a product that does not exist", "/product/does-not-exist"],
    ["a product address with a quote and SQL-looking text", "/product/%27%20or%201%3D1--"],
    ["a product address with a broken %-sequence", "/product/%E0%A4%A"],
    ["a product address with a null byte", "/product/%00"],
    ["a very long product address", `/product/${"a".repeat(600)}`],
    ["a category that does not exist", "/category/nope"],
    ["a category address with a broken %-sequence", "/category/%E0%A4%A"],
    ["a category address with SQL-looking text", "/category/%27%20or%201%3D1--"],
  ] as const) {
    test(`${what} is a real 404 with a way back`, async ({ page }) => {
      const response = await page.goto(urlPath)
      expect(response?.status()).toBe(404)
      await expect(notFoundHeading(page)).toBeVisible()
      await expect(page.locator("main").getByRole("link").filter({ visible: true }).first()).toBeVisible() // somewhere to go next
    })
  }

  test("an unknown page anywhere gets the site's own 404", async ({ page }) => {
    const response = await page.goto("/this/page/does/not/exist")
    expect(response?.status()).toBe(404)
    await expect(notFoundHeading(page)).toHaveText(en.common.pageNotFound)
    await page.locator("main").getByRole("link", { name: en.common.backHome }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test("someone else's order, and a made-up order id, both say 'not found' (and look identical)", async ({ page, shopper, stranger }) => {
    const product = await createTestProduct({ price: 300, stock: 3 })
    const order = await placeOrderAs(stranger, [{ product_id: product.id, quantity: 1 }])
    await signIn(page, shopper)
    const texts: string[] = []
    for (const id of [order.id, "00000000-0000-0000-0000-000000000000", "not-a-uuid"]) {
      await page.goto(`/orders/${id}`)
      await expect(page.locator("main")).toContainText(en.order.notFound)
      texts.push((await page.locator("main").innerText()).replace(/\s+/g, " "))
    }
    expect(new Set(texts).size).toBe(1) // no way to tell "exists but not yours" from "doesn't exist"
  })
})

test.describe("8. Unauthorized admin access", () => {
  test("a signed-out visitor is sent to log in", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/)
  })

  test("a customer never gets any admin page, and sees no admin content", async ({ page, shopper }) => {
    await signIn(page, shopper)
    for (const path of ["/admin", "/admin/products", "/admin/products/new", "/admin/orders", "/admin/customers", "/admin/homepage"]) {
      await page.goto(path)
      await expect(page).toHaveURL(/localhost:\d+\/$/)
      await expect(page.getByText(en.admin.dashboard.todaysSales)).toHaveCount(0)
    }
  })

  test("a customer cannot change the catalog or read other people's data through the API either", async ({ shopper, stranger }) => {
    const product = await createTestProduct({ price: 300, stock: 3 })
    const order = await placeOrderAs(stranger, [{ product_id: product.id, quantity: 1 }])
    const client = await clientFor(shopper)

    const update = await client.from("products").update({ price: 1 }).eq("id", product.id).select()
    expect(update.data ?? []).toEqual([]) // row-level security: zero rows changed
    expect(Number((await admin().from("products").select("price").eq("id", product.id).single()).data?.price)).toBe(300)
    expect((await client.from("products").insert({ slug: "e2e-should-not-exist", name_en: "x", name_am: "x", sku: "E2E-NOPE", price: 1, stock: 1 })).error).not.toBeNull()
    expect(((await client.from("orders").select("id").eq("id", order.id)).data ?? [])).toEqual([]) // someone else's order
    expect(((await client.from("profiles").select("id").eq("id", stranger.id)).data ?? [])).toEqual([]) // someone else's profile
    expect(((await client.from("orders").update({ status: "delivered" }).eq("id", order.id).select()).data ?? [])).toEqual([])
    expect((await admin().from("orders").select("status").eq("id", order.id).single()).data?.status).toBe("pending")

    const visitor = anonymousClient()
    expect(((await visitor.from("orders").select("id")).data ?? [])).toEqual([])
    expect(((await visitor.from("profiles").select("id")).data ?? [])).toEqual([])
    expect((await visitor.from("products").update({ price: 1 }).eq("id", product.id).select()).data ?? []).toEqual([])
  })
})

test.describe("9. Database failure", () => {
  test("account pages that load their data in the browser explain a failed load, with a way to retry", async ({ page, shopper }) => {
    test.setTimeout(150_000)
    await signIn(page, shopper)
    await page.route("**/rest/v1/**", (route) => route.abort("failed")) // the browser can no longer reach the database
    await page.goto("/account/orders")
    // The database client retries a failed read a few times (1 s, 2 s, 4 s) and the account's own
    // profile lookup does the same first, so the message takes about 15 seconds to appear; the point is that it does.
    await expect(page.locator("main")).toContainText(en.account.orders.loadFailed, { timeout: 60_000 })
    await expect(page.locator("main")).toContainText(en.account.orders.refresh)
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0) // not an endless skeleton
  })

  test("the cart on this device keeps what the customer added when the sync fails", async ({ page, shopper }) => {
    const product = await createTestProduct({ price: 300, stock: 5 })
    await admin().from("cart_items").insert({ user_id: shopper.id, product_id: product.id, quantity: 2 })
    await signIn(page, shopper)
    await page.goto("/cart")
    await expect(page.locator("main")).toContainText(product.name_en)
    await page.route("**/rest/v1/cart_items**", (route) => route.abort("failed"))
    await page.reload()
    await expect(page.locator("main")).toContainText(product.name_en) // a failed server load never empties the cart on screen
  })

  test("a failed login request says so instead of failing silently", async ({ page }) => {
    await page.goto("/login")
    await waitForHydration(page)
    await page.route("**/auth/v1/**", (route) => route.abort("failed"))
    const main = page.locator("main")
    await main.getByLabel(en.auth.fields.email, { exact: true }).fill("someone@example.com")
    await main.getByLabel(en.auth.fields.password, { exact: true }).fill("Some-password-1!")
    await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
    await expect(main.getByRole("alert")).toBeVisible()
    await expect(main.getByRole("button", { name: en.auth.login.submit, exact: true })).toBeEnabled()
  })

  test("the search suggestions failing does not break the page", async ({ page, catalog, problems }) => {
    await page.route("**/rest/v1/**", (route) => route.abort("failed"))
    await page.goto("/")
    const box = page.locator('input[type="search"]:visible').first()
    await box.fill(catalog[0].name_en.split(" ")[0])
    await page.waitForTimeout(1500)
    await expect(box).toBeVisible()
    await box.press("Enter") // a full search still works: it is rendered by the server
    await expect(page).toHaveURL(/\/search\?q=/)
    expect(problems.errors.filter((e) => e.startsWith("pageerror"))).toEqual([])
  })
})

test.describe("10. Image failure", () => {
  const brokenStorage = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/e2e-does-not-exist.jpg`

  for (const [what, imageUrl] of [
    ["a photo that was deleted from storage", brokenStorage],
    ["a photo on some other website that no longer answers", () => "https://images.invalid/nothing.jpg"],
  ] as const) {
    test(`${what}: the product still shows, with its placeholder, and no broken-picture icon`, async ({ page, problems }) => {
      const product = await createTestProduct({ imageUrl: imageUrl() })
      await page.goto(`/product/${product.slug}`)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name_en)
      await page.waitForTimeout(2500) // the failed picture has been given up on
      const broken = await page.locator("main img").evaluateAll((imgs) => imgs.filter((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 0).length)
      expect(broken).toBe(0)
      await expect(page.locator("main").getByRole("img", { name: new RegExp(product.name_en) }).first()).toBeVisible() // the placeholder is named for the product
      await visible(page.getByRole("button", { name: en.product.addToCart, exact: true })).click() // the page still works
      await expect(page.getByText(en.product.addedToCart)).toBeVisible()
      expect(problems.errors.filter((e) => e.startsWith("pageerror"))).toEqual([])
    })
  }

  test("a product with no photo at all shows the placeholder in the shop's product grid", async ({ page }) => {
    const product = await createTestProduct()
    await page.goto(`/search?q=${encodeURIComponent(product.name_en)}`)
    await expect(page.locator("main").getByRole("link").filter({ hasText: product.name_en }).first()).toBeVisible()
    await expect(page.locator("main").getByRole("img", { name: new RegExp(product.name_en) }).first()).toBeVisible()
  })
})
