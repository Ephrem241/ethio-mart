import { en } from "@/locales/en"

import { admin, clientFor } from "./support/db"
import { expect, test } from "./support/fixtures"
import { signIn } from "./support/ui"

// Admin access is given and taken away from Admin → Customers, after
// confirming. An admin can't change their own access, and a customer can't
// make anyone (themselves included) an admin.

const roleOf = async (id: string) => (await admin().from("profiles").select("role").eq("id", id).single()).data?.role

const fill = (template: string, name: string) => template.replace("{name}", name)

test.describe("Admin access management", () => {
  test("an admin makes a customer an admin, who can then open the admin, and takes it away again", async ({ page, browser, adminUser, shopper }) => {
    await signIn(page, adminUser)
    await page.goto("/admin/customers")
    const table = page.getByRole("region", { name: en.admin.customers.title }).getByRole("table")
    const shopperRow = table.getByRole("row").filter({ hasText: shopper.email })
    await expect(shopperRow).toContainText(en.admin.customers.roleCustomer)

    // Their own row: no button, so they can't lock themselves out.
    const ownRow = table.getByRole("row").filter({ hasText: adminUser.email })
    await expect(ownRow).toContainText(en.admin.customers.you)
    await expect(ownRow.getByRole("button")).toHaveCount(0)

    // Cancelling changes nothing.
    await shopperRow.getByRole("button", { name: fill(en.admin.customers.makeAdminLabel, shopper.fullName) }).click()
    let dialog = page.getByRole("dialog", { name: fill(en.admin.customers.makeAdminTitle, shopper.fullName) })
    await dialog.getByRole("button", { name: en.common.cancel }).click()
    await expect(dialog).toBeHidden()
    expect(await roleOf(shopper.id)).toBe("customer")

    // Confirming makes them an admin.
    await shopperRow.getByRole("button", { name: fill(en.admin.customers.makeAdminLabel, shopper.fullName) }).click()
    dialog = page.getByRole("dialog", { name: fill(en.admin.customers.makeAdminTitle, shopper.fullName) })
    await dialog.getByRole("button", { name: en.admin.customers.makeAdmin }).click()
    await expect(page.getByText(fill(en.admin.customers.madeAdmin, shopper.fullName))).toBeVisible()
    await expect(shopperRow).toContainText(en.admin.customers.roleAdmin)
    expect(await roleOf(shopper.id)).toBe("admin")

    // The new admin signs in and lands in the admin.
    const other = await browser.newContext()
    const theirPage = await other.newPage()
    await signIn(theirPage, shopper, /\/admin$/)
    await expect(theirPage.getByRole("heading", { level: 1, name: en.admin.dashboard.title })).toBeVisible()

    // Taking it away: they're a customer again, and the admin is closed to them.
    await shopperRow.getByRole("button", { name: fill(en.admin.customers.removeAdminLabel, shopper.fullName) }).click()
    dialog = page.getByRole("dialog", { name: fill(en.admin.customers.removeAdminTitle, shopper.fullName) })
    await dialog.getByRole("button", { name: en.admin.customers.removeAdmin }).click()
    await expect(page.getByText(fill(en.admin.customers.removedAdmin, shopper.fullName))).toBeVisible()
    await expect(shopperRow).toContainText(en.admin.customers.roleCustomer)
    expect(await roleOf(shopper.id)).toBe("customer")
    await theirPage.goto("/admin/customers")
    await expect(theirPage).toHaveURL(/\/$/)
    await other.close()
  })

  test("a customer can't make themselves or anyone else an admin", async ({ shopper, stranger }) => {
    const client = await clientFor(shopper)
    for (const id of [shopper.id, stranger.id]) {
      await client.from("profiles").update({ role: "admin" }).eq("id", id)
      expect(await roleOf(id)).toBe("customer")
    }
  })
})
