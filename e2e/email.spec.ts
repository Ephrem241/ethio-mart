import { en } from "@/locales/en"

import { admin, anonymousClient, clientFor, placeOrderAs } from "./support/db"
import { expect, test } from "./support/fixtures"
import { setLanguage, signIn } from "./support/ui"

// Email (migration 0019, src/lib/email): the database queues every email, and
// /api/email/dispatch sends what is queued. These tests check the queuing and
// the contact form against the real database. They never send mail: every
// address here is an e2e-…@example.com one, which the sender refuses to mail
// even when email is configured, and the test server normally has no email
// settings.

const outboxFor = async (column: "order_id" | "contact_id", id: string) =>
  (await admin().from("email_outbox").select("kind, status, locale, state").eq(column, id).order("created_at")).data ?? []

async function deleteContactMessages(email: string) {
  await admin().from("contact_messages").delete().eq("email", email)
}

test.describe("Email", () => {
  test("the contact form checks the message, sends it to the shop's queue, and says so", async ({ page }) => {
    const email = `e2e-contact-${Date.now().toString(36)}@example.com`
    try {
      await page.goto("/contact")
      const form = page.locator("main form")
      await form.getByRole("button", { name: en.contactForm.send }).click()
      await expect(form.getByText(en.contactForm.errors.name)).toBeVisible()
      await expect(form.getByText(en.validation.email)).toBeVisible()
      await expect(form.getByText(en.contactForm.errors.messageLength)).toBeVisible()

      await form.getByLabel(en.contactForm.name, { exact: true }).fill("E2E Visitor")
      await form.getByLabel(en.contactForm.email, { exact: true }).fill(email)
      await form.getByLabel(en.contactForm.subject, { exact: true }).fill("Delivery question")
      await form.getByLabel(en.contactForm.message, { exact: true }).fill("Do you deliver to Hawassa?\nThank you.")
      await form.getByRole("button", { name: en.contactForm.send }).click()

      const confirmation = page.getByRole("heading", { name: en.contactForm.sentTitle })
      await expect(confirmation).toBeVisible()
      await expect(confirmation).toBeFocused()

      const { data: messages } = await admin().from("contact_messages").select("id, name, subject, message").eq("email", email)
      expect(messages).toHaveLength(1)
      expect(messages![0]).toMatchObject({ name: "E2E Visitor", subject: "Delivery question", message: "Do you deliver to Hawassa?\nThank you." })
      expect(await outboxFor("contact_id", messages![0].id)).toMatchObject([{ kind: "contact" }])

      // "Send another message" brings back an empty form.
      await page.getByRole("button", { name: en.contactForm.sendAnother }).click()
      await expect(page.locator("main form").getByLabel(en.contactForm.name, { exact: true })).toHaveValue("")
    } finally {
      await deleteContactMessages(email)
    }
  })

  test("the contact form's hidden spam trap: looks sent, stores nothing", async ({ page }) => {
    const email = `e2e-robot-${Date.now().toString(36)}@example.com`
    try {
      await page.goto("/contact")
      const form = page.locator("main form")
      await form.getByLabel(en.contactForm.name, { exact: true }).fill("Robot")
      await form.getByLabel(en.contactForm.email, { exact: true }).fill(email)
      await form.getByLabel(en.contactForm.message, { exact: true }).fill("Buy cheap things at my website now")
      await page.locator("#contact-website").fill("https://spam.invalid", { force: true })
      await form.getByRole("button", { name: en.contactForm.send }).click()
      await expect(page.getByRole("heading", { name: en.contactForm.sentTitle })).toBeVisible()
      const { data } = await admin().from("contact_messages").select("id").eq("email", email)
      expect(data).toEqual([])
    } finally {
      await deleteContactMessages(email)
    }
  })

  test("the database refuses a flood of messages from one address", async () => {
    const email = `e2e-flood-${Date.now().toString(36)}@example.com`
    const visitor = anonymousClient()
    const send = () =>
      visitor.rpc("submit_contact_message", { p_name: "Flood", p_email: email, p_subject: "", p_message: "Message number something", p_locale: "en" })
    try {
      for (let i = 0; i < 3; i++) expect((await send()).error).toBeNull()
      expect((await send()).error?.message).toMatch(/^Too many messages/)
    } finally {
      await deleteContactMessages(email)
    }
  })

  test("an order queues the customer's confirmation (in their language) and the shop's alert; status changes queue updates", async ({ page, baseURL, shopper, catalog }) => {
    const order = await placeOrderAs(shopper, [{ product_id: catalog[0].id, quantity: 1 }])
    expect(await outboxFor("order_id", order.id)).toMatchObject([
      { kind: "order_confirmation", locale: "en", state: "pending" },
      { kind: "order_alert", locale: "en", state: "pending" },
    ])

    // The checkout's ping, from the shopper's signed-in browser in Amharic.
    await signIn(page, shopper)
    await setLanguage(page.context(), "am", baseURL!)
    const status = await page.evaluate(async (orderId) => {
      const response = await fetch("/api/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, locale: "am" }),
      })
      return response.status
    }, order.id)
    // 503 = this server has no email settings (emails stay queued); 202 = it has.
    expect([202, 503]).toContain(status)
    await expect.poll(async () => (await admin().from("orders").select("locale").eq("id", order.id).single()).data?.locale).toBe("am")
    const queued = await outboxFor("order_id", order.id)
    expect(queued.find((row) => row.kind === "order_confirmation")?.locale).toBe("am")
    expect(queued.find((row) => row.kind === "order_alert")?.locale).toBe("en")

    // Status changes the customer hears about queue one email each; "preparing" doesn't.
    for (const next of ["confirmed", "preparing", "shipped"]) {
      const { error } = await admin().from("orders").update({ status: next }).eq("id", order.id)
      expect(error).toBeNull()
    }
    const updates = (await outboxFor("order_id", order.id)).filter((row) => row.kind === "order_status")
    expect(updates.map((row) => [row.status, row.locale])).toEqual([
      ["confirmed", "am"],
      ["shipped", "am"],
    ])
  })

  test("only the order's owner can set its language, and nobody can read the queue", async ({ shopper, stranger, catalog }) => {
    const order = await placeOrderAs(shopper, [{ product_id: catalog[0].id, quantity: 1 }])
    const other = await clientFor(stranger)
    expect((await other.rpc("set_order_locale", { p_order_id: order.id, p_locale: "am" })).error).toBeNull()
    expect((await admin().from("orders").select("locale").eq("id", order.id).single()).data?.locale).toBe("en")

    for (const client of [anonymousClient(), await clientFor(shopper)]) {
      const { data } = await client.from("email_outbox").select("id")
      expect(data ?? []).toEqual([])
      const claim = await client.rpc("claim_email_outbox", { p_secret: "x".repeat(40), p_limit: 10 })
      expect(claim.error?.message).toBe("Not allowed.")
    }
  })
})
