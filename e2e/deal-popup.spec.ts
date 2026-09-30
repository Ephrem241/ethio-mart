import type { Page } from "@playwright/test"

import { en } from "@/locales/en"
import { DEAL_POPUP_DELAY_MS, DEAL_POPUP_SESSION_KEY, DEAL_POPUP_SHOWN_AT_KEY } from "@/lib/deal-popup"

import { expect, LIVE_DEAL_POPUP_FLAG, test } from "./support/fixtures"

// The homepage's deal popup (src/components/home/deal-popup.tsx) with its
// real timing and memory. Every other spec starts with it marked as shown
// (support/fixtures.ts); this one switches that off for its own context.
// It needs at least one product on sale, as the seeded catalog has.

async function freshVisit(page: Page) {
  await page.goto("/about")
  await page.evaluate(
    ([flag, sessionKey, shownAtKey]) => {
      window.localStorage.setItem(flag, "live")
      window.localStorage.removeItem(shownAtKey)
      window.sessionStorage.removeItem(sessionKey)
    },
    [LIVE_DEAL_POPUP_FLAG, DEAL_POPUP_SESSION_KEY, DEAL_POPUP_SHOWN_AT_KEY] as const
  )
  // Not waiting for "load": that can take seconds on a slow link, and the
  // popup's clock starts as soon as the page is interactive.
  await page.goto("/", { waitUntil: "domcontentloaded" })
}

const popup = (page: Page) => page.getByRole("dialog")
const badge = (page: Page) => page.getByRole("button", { name: /OFF: show today's deal/ })

test.describe("Homepage deal popup", () => {
  test("waits a few seconds, then opens once per session with a live countdown", async ({ page }) => {
    await freshVisit(page)

    // Not straight away: hidden when the page arrives, and only shown once the
    // delay has passed since navigation started (measured inside the page).
    await expect(popup(page)).toBeHidden()
    await expect(popup(page)).toBeVisible({ timeout: DEAL_POPUP_DELAY_MS + 15_000 })
    expect(await page.evaluate(() => performance.now())).toBeGreaterThanOrEqual(DEAL_POPUP_DELAY_MS)
    await expect(popup(page)).toHaveAttribute("aria-modal", "true")
    // Its name is the admin's promo headline, with the real discount filled in.
    await expect(popup(page)).toHaveAccessibleName(/\d+%/)
    // Focus moved into the dialog: the close button comes first.
    await expect(popup(page).getByRole("button", { name: en.common.close })).toBeFocused()

    // The countdown really ticks.
    const timer = popup(page).getByRole("timer", { name: en.home.deals.timeLeft })
    const before = await timer.innerText()
    await expect.poll(() => timer.innerText(), { timeout: 5_000 }).not.toBe(before)

    // The page underneath can't scroll while it is open.
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden")

    await page.keyboard.press("Escape")
    await expect(popup(page)).toBeHidden()
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden")

    // The floating button takes over; a reload doesn't bring the popup back.
    await expect(badge(page)).toBeVisible()
    await page.reload()
    await page.waitForTimeout(DEAL_POPUP_DELAY_MS + 2_000)
    await expect(popup(page)).toBeHidden()
    await expect(badge(page)).toBeVisible()

    // Other pages never get it.
    await page.goto("/shop")
    await expect(badge(page)).toBeHidden()
  })

  test("the floating button reopens it, and focus returns to the button", async ({ page }) => {
    await freshVisit(page)
    await expect(popup(page)).toBeVisible({ timeout: DEAL_POPUP_DELAY_MS + 10_000 })
    await popup(page).getByRole("button", { name: en.home.dealPopup.notNow }).click()
    await expect(popup(page)).toBeHidden()

    await badge(page).click()
    await expect(popup(page)).toBeVisible()
    await popup(page).getByRole("button", { name: en.common.close }).click()
    await expect(popup(page)).toBeHidden()
    await expect(badge(page)).toBeFocused()
  })

  test("the button goes to the deals and doesn't reopen the popup", async ({ page }) => {
    await freshVisit(page)
    await expect(popup(page)).toBeVisible({ timeout: DEAL_POPUP_DELAY_MS + 10_000 })
    await popup(page).getByRole("link").click()
    await expect(page).toHaveURL(/\/shop\?sale=1/)
    await expect(popup(page)).toBeHidden()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.nav.deals)

    await page.goto("/")
    await page.waitForTimeout(DEAL_POPUP_DELAY_MS + 2_000)
    await expect(popup(page)).toBeHidden()
  })
})
