import type { BrowserContext, Locator, Page } from "@playwright/test"

import { en } from "@/locales/en"

import type { TestUser } from "./db"

// Small helpers shared by the specs. Locators go by role, label and visible
// text (never by CSS classes), reading the wording from the English dictionary
// so a copy change doesn't break every test.

/**
 * React attaches its handlers a moment after a page is shown. A click before
 * then submits a form the browser's own way (a GET with the password in the
 * address). Wait for the page's form to be wired up before using it.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const form = document.querySelector("main form:has(input)")
      return !!form && Object.keys(form).some((key) => key.startsWith("__reactProps"))
    },
    null,
    { timeout: 20_000 }
  )
}

/** Signs in through the log-in form, like a person would. */
export async function signIn(page: Page, user: TestUser, expectUrl: RegExp = /\/account|\/admin/): Promise<void> {
  await page.goto("/login")
  await waitForHydration(page)
  const main = page.locator("main")
  await main.getByLabel(en.auth.fields.email, { exact: true }).fill(user.email)
  await main.getByLabel(en.auth.fields.password, { exact: true }).fill(user.password)
  await main.getByRole("button", { name: en.auth.login.submit, exact: true }).click()
  await page.waitForURL(expectUrl)
}

/** The first of several matches that a person can actually see (phone and desktop layouts both exist in the page). */
export function visible(locator: Locator): Locator {
  return locator.filter({ visible: true }).first()
}

export function addToCartButton(page: Page): Locator {
  return visible(page.getByRole("button", { name: en.product.addToCart, exact: true }))
}

export function searchBox(page: Page): Locator {
  return page.locator('input[type="search"]:visible').first()
}

export async function searchFor(page: Page, term: string): Promise<void> {
  const box = searchBox(page)
  await box.fill(term)
  await box.press("Enter")
}

/** Puts a language's button in the header (or the compact phone toggle) to use. */
export async function switchLanguage(page: Page, to: "en" | "am"): Promise<void> {
  await visible(page.locator(`button[lang="${to}"]`)).click()
  await page.waitForFunction((lang) => document.documentElement.lang === lang, to)
}

export async function setLanguage(context: BrowserContext, locale: "en" | "am", baseURL: string): Promise<void> {
  await context.addCookies([{ name: "locale", value: locale, url: baseURL }])
}

export interface DeliveryDetails {
  fullName: string
  phone: string
  city: string
  subCity: string
  woreda: string
  address: string
  notes?: string
}

export const DELIVERY: DeliveryDetails = {
  fullName: "E2E Buyer",
  phone: "0911223344",
  city: "Adama",
  subCity: "Kebele 2",
  woreda: "05",
  address: "Behind the market, house 9",
  notes: "Call on arrival",
}

/** Fills the checkout delivery form. */
export async function fillDelivery(page: Page, details: DeliveryDetails = DELIVERY): Promise<void> {
  const form = page.locator("main form")
  await form.getByLabel(en.checkout.delivery.fullName, { exact: true }).fill(details.fullName)
  await form.getByLabel(en.checkout.delivery.phone, { exact: true }).fill(details.phone)
  await form.getByLabel(en.checkout.delivery.city, { exact: true }).selectOption(details.city)
  await form.getByLabel(en.checkout.delivery.subCity, { exact: true }).fill(details.subCity)
  await form.getByLabel(en.checkout.delivery.woreda, { exact: true }).fill(details.woreda)
  await form.getByLabel(en.checkout.delivery.address, { exact: true }).fill(details.address)
  if (details.notes) await form.getByLabel(new RegExp(`^${en.checkout.delivery.notes}`)).fill(details.notes)
}

/** Formats an amount the way the shop does: "1,850 ETB". */
export function etb(amount: number): string {
  return en.common.money.replace("{amount}", new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount))
}

// ---------------------------------------------------------------------------
// Problems a person would notice: script errors, failed loads, broken pictures
// ---------------------------------------------------------------------------

export interface Problems {
  /** Uncaught exceptions and console errors. */
  errors: string[]
  /** Requests to the shop's own address that came back 4xx/5xx (other than expected 404 pages). */
  failedRequests: string[]
}

// Noise that is not a defect: the browser cancelling a request when the page
// moves on (a prefetch), and the console line it logs for a 404 the test caused on purpose.
const IGNORED_ERROR = /net::ERR_ABORTED|Failed to load resource|ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED/i

export function watchProblems(page: Page): Problems {
  const problems: Problems = { errors: [], failedRequests: [] }
  page.on("pageerror", (error) => problems.errors.push(`pageerror: ${error.message}`))
  page.on("console", (message) => {
    if (message.type() === "error" && !IGNORED_ERROR.test(message.text())) problems.errors.push(`console: ${message.text().slice(0, 200)}`)
  })
  page.on("response", (response) => {
    const url = new URL(response.url())
    const own = url.origin === new URL(page.url() === "about:blank" ? response.url() : page.url()).origin
    if (own && response.status() >= 400 && !/\/_next\/image|\/favicon|\.map$/.test(url.pathname)) {
      problems.failedRequests.push(`${response.status()} ${url.pathname}`)
    }
  })
  return problems
}
