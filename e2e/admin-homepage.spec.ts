import { en } from "@/locales/en"

import { expect, test } from "./support/fixtures"
import { signIn } from "./support/ui"

// The storefront shows a line break in the hero headline, so the admin form has
// to let the administrator see and type one. (A one-line input hid it, and
// dropped it as soon as the headline was edited.) Nothing is saved here: the
// homepage text is the shop's real content, not test data.
test.describe("Admin: homepage headline", () => {
  test("the hero headline is a multi-line field that keeps a line break", async ({ page, adminUser }) => {
    await signIn(page, adminUser)
    await page.goto("/admin/homepage")
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText(en.admin.homepage.title)

    for (const id of ["heroHeadline", "heroHeadlineAm"]) {
      const field = page.locator(`#${id}`)
      await expect(field).toBeVisible()
      expect(await field.evaluate((el) => el.tagName)).toBe("TEXTAREA")
      await field.fill("First line\nSecond line")
      await expect(field).toHaveValue("First line\nSecond line")
    }

    // The other one-line fields stay one-line.
    expect(await page.locator("#heroSubtext").evaluate((el) => el.tagName)).toBe("INPUT")
  })
})
