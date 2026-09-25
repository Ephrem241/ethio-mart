import { mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import AxeBuilder from "@axe-core/playwright"
import type { Browser, BrowserContext, Page } from "@playwright/test"

import { admin, createTestProduct, createTestUser, deleteTestUser, placeOrderAs, stockedProducts, type TestUser } from "./support/db"
import { expect, test } from "./support/fixtures"
import { signIn, watchProblems } from "./support/ui"

// FINAL QUALITY AUDIT (section 84): every route, on desktop, tablet and phone.
// Spacing and typography are judged by eye (see the README); what a machine can
// say for certain is checked here on every route at every size:
//   status, title, one h1, a main area, no script errors, no failed requests,
//   no broken pictures, no sideways scrolling, nothing stuck loading, search
//   engine tags (indexable pages) or noindex (private ones), and accessibility.

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const

type Role = "guest" | "customer" | "admin"
interface Route {
  path: (data: AuditData) => string
  role: Role
  status?: number
  /** Private pages (cart, account, admin, sign-in) must not be indexed; public ones must describe themselves. */
  indexable: boolean
}
interface AuditData {
  productSlug: string
  categorySlug: string
  productId: string
  orderId: string
}

const guest = (p: string | ((d: AuditData) => string), indexable = true, status = 200): Route => ({ path: typeof p === "string" ? () => p : p, role: "guest", indexable, status })
const customer = (p: string | ((d: AuditData) => string)): Route => ({ path: typeof p === "string" ? () => p : p, role: "customer", indexable: false })
const adminRoute = (p: string | ((d: AuditData) => string)): Route => ({ path: typeof p === "string" ? () => p : p, role: "admin", indexable: false })

const ROUTES: Route[] = [
  guest("/"),
  guest("/shop"),
  guest("/shop?sale=1"),
  guest("/categories"),
  guest((d) => `/category/${d.categorySlug}`),
  guest((d) => `/product/${d.productSlug}`),
  guest("/deals"),
  guest("/search?q=leather", false),
  guest("/about"),
  guest("/contact"),
  guest("/faq"),
  guest("/delivery"),
  guest("/returns"),
  guest("/privacy"),
  guest("/terms"),
  guest("/cart", false),
  guest("/login", false),
  guest("/register", false),
  guest("/forgot-password", false),
  guest("/reset-password", false),
  guest("/this-page-does-not-exist", false, 404),
  guest("/product/does-not-exist", false, 404),
  customer("/account"),
  customer("/account/orders"),
  customer("/account/addresses"),
  customer("/account/favorites"),
  customer("/account/settings"),
  customer("/checkout"),
  customer((d) => `/orders/${d.orderId}`),
  customer((d) => `/order/success/${d.orderId}`),
  adminRoute("/admin"),
  adminRoute("/admin/products"),
  adminRoute("/admin/products/new"),
  adminRoute((d) => `/admin/products/${d.productId}/edit`),
  adminRoute("/admin/categories"),
  adminRoute("/admin/orders"),
  adminRoute((d) => `/admin/orders/${d.orderId}`),
  adminRoute("/admin/customers"),
  adminRoute("/admin/homepage"),
]

const STATE_DIR = path.join(tmpdir(), "ethio-mart-e2e")

let data: AuditData
let users: Record<"customer" | "admin", TestUser>
const stateFile = (role: "customer" | "admin") => path.join(STATE_DIR, `audit-${role}.json`)

test.describe("Quality audit: every route at every size", () => {
  // The accounts and the customer's order are made once for the whole audit.
  test.beforeAll(async ({ browser }) => {
    mkdirSync(STATE_DIR, { recursive: true })
    const [first] = await stockedProducts(1)
    const { data: category } = await admin().from("categories").select("slug").eq("id", first.category_id).single()
    const item = await createTestProduct({ price: 300, stock: 5 })
    users = { customer: await createTestUser({ tag: "audit-customer" }), admin: await createTestUser({ tag: "audit-admin", role: "admin" }) }
    const order = await placeOrderAs(users.customer, [{ product_id: item.id, quantity: 1 }])
    await admin().from("cart_items").insert({ user_id: users.customer.id, product_id: first.id, quantity: 1 }) // something in the cart for /checkout
    await admin().from("addresses").insert({ user_id: users.customer.id, full_name: "E2E Buyer", phone: "0911223344", city: "Adama", sub_city: "K2", woreda: "05", address: "Behind the market", is_default: true })
    await admin().from("favorites").insert({ user_id: users.customer.id, product_id: first.id })
    data = { productSlug: first.slug, categorySlug: category!.slug as string, productId: item.id, orderId: order.id }

    for (const role of ["customer", "admin"] as const) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, users[role])
      if (role === "customer") {
        await page.goto("/cart") // lets the sign-in sync the cart onto this device, so /checkout can open
        await expect(page.locator("main")).toContainText(first.name_en)
      }
      await context.storageState({ path: stateFile(role) })
      await context.close()
    }
  })

  test.afterAll(async () => {
    for (const user of Object.values(users ?? {})) await deleteTestUser(user.id)
  })

  async function open(browser: Browser, role: Role, viewport: { width: number; height: number }): Promise<BrowserContext> {
    return browser.newContext({
      viewport,
      isMobile: viewport.width < 768,
      hasTouch: viewport.width < 768,
      reducedMotion: "reduce", // no half-faded content for the accessibility check to trip over
      storageState: role === "guest" ? undefined : stateFile(role),
    })
  }

  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}px)`, () => {
      for (const route of ROUTES) {
        test(`${route.role}: ${route.path({ productSlug: "…", categorySlug: "…", productId: "…", orderId: "…" })}`, async ({ browser, baseURL }) => {
          test.setTimeout(120_000)
          const context = await open(browser, route.role, viewport)
          const page = await context.newPage()
          const problems = watchProblems(page)
          const url = route.path(data)
          const found: string[] = []

          const response = await page.goto(url, { waitUntil: "load" })
          const expected = route.status ?? 200
          if (response?.status() !== expected) found.push(`status ${response?.status()}, expected ${expected}`)
          await settle(page)

          // structure
          const facts = await page.evaluate(() => ({
            title: document.title.trim(),
            h1: document.querySelectorAll("h1").length,
            hasMain: !!document.querySelector("main"),
            lang: document.documentElement.lang,
            description: document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "",
            canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
            ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
            ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "",
            robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
            busy: document.querySelectorAll('[aria-busy="true"]').length,
            overflow: document.documentElement.scrollWidth - window.innerWidth,
          }))
          if (!facts.title) found.push("no <title>")
          if (facts.h1 !== 1) found.push(`${facts.h1} <h1> elements (want exactly one)`)
          if (!facts.hasMain) found.push("no <main>")
          if (!facts.lang) found.push("no lang on <html>")
          if (facts.busy > 0) found.push(`${facts.busy} region(s) still loading after 15 s`)
          if (facts.overflow > 1) found.push(`scrolls sideways by ${facts.overflow}px`)

          // search engines: public pages describe themselves, private ones stay out of results
          if (route.indexable) {
            if (!facts.description) found.push("no meta description")
            if (facts.description.length > 320) found.push(`meta description is ${facts.description.length} characters`)
            if (!facts.canonical) found.push("no canonical link")
            if (!facts.ogTitle || !facts.ogImage) found.push("missing Open Graph title or image")
            if (/noindex/i.test(facts.robots)) found.push("a public page is marked noindex")
          } else if (expected === 200 && route.role !== "guest") {
            if (!/noindex/i.test(facts.robots)) found.push("a private page is not marked noindex")
          }

          // pictures: scroll through so lazy ones load, then none may be broken
          const broken = await scrollAndFindBrokenImages(page)
          if (broken.length) found.push(`broken image(s): ${broken.slice(0, 3).join(", ")}`)

          // scripts and requests
          for (const error of problems.errors) found.push(error)
          for (const failed of problems.failedRequests) if (!(expected === 404 && failed.endsWith(new URL(url, baseURL).pathname))) found.push(`request failed: ${failed}`)

          // accessibility
          const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze()
          for (const violation of axe.violations) found.push(`accessibility: ${violation.id} (${violation.nodes.length}): ${violation.nodes[0]?.target.join(" ")}`)

          expect(found, `${url} at ${viewport.width}px`).toEqual([])
          await context.close()
        })
      }
    })
  }

  test("every internal link on the main pages leads somewhere that works", async ({ browser, request }) => {
    test.setTimeout(240_000)
    const context = await open(browser, "guest", VIEWPORTS[0])
    const page = await context.newPage()
    const links = new Set<string>()
    for (const url of ["/", "/shop", `/product/${data.productSlug}`, `/category/${data.categorySlug}`, "/categories", "/about", "/faq", "/cart"]) {
      await page.goto(url, { waitUntil: "load" })
      await settle(page)
      for (const href of await page.locator("a[href]").evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""))) {
        if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/_next/")) links.add(href.split("#")[0])
      }
    }
    await context.close()
    expect(links.size).toBeGreaterThan(20)
    const broken: string[] = []
    for (const href of links) {
      const response = await request.get(href, { maxRedirects: 5 })
      if (!response.ok()) broken.push(`${response.status()} ${href}`)
    }
    expect(broken).toEqual([])
  })

  test("the sitemap lists only pages that exist, and robots.txt points to it", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.ok()).toBe(true)
    const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname + new URL(m[1]).search)
    expect(urls.length).toBeGreaterThan(10)
    const broken: string[] = []
    for (const url of urls) {
      const response = await request.get(url)
      if (!response.ok()) broken.push(`${response.status()} ${url}`)
    }
    expect(broken).toEqual([])
    const robots = await (await request.get("/robots.txt")).text()
    expect(robots).toMatch(/Sitemap:/i)
    expect(robots).toMatch(/Disallow:\s*\/admin/i)
  })
})

/** Waits for skeletons to give way to content, then a moment for things to settle. */
async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(600)
}

async function scrollAndFindBrokenImages(page: Page): Promise<string[]> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1200)
  return page.evaluate(() =>
    [...document.images]
      .filter((img) => img.currentSrc && img.complete && img.naturalWidth === 0 && getComputedStyle(img).display !== "none")
      .map((img) => img.currentSrc.slice(-60))
  )
}
