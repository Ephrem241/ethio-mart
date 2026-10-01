import { en } from "@/locales/en"

import { admin, anonymousClient, clientFor } from "./support/db"
import { expect, test } from "./support/fixtures"
import { signIn } from "./support/ui"

// The admin's Messages inbox (migration 0020): contact-form messages are read,
// answered by email, marked unread and deleted from /admin/messages. No mail
// is sent: the customer address is an e2e-…@example.com one, which the sender
// refuses to mail even when email is configured.

async function sendContactMessage(name: string, email: string, locale: "en" | "am") {
  const { error } = await anonymousClient().rpc("submit_contact_message", {
    p_name: name,
    p_email: email,
    p_subject: "Delivery to Hawassa",
    p_message: "Do you deliver to Hawassa?\nThank you.",
    p_locale: locale,
  })
  expect(error).toBeNull()
  const { data } = await admin().from("contact_messages").select("id").eq("email", email).single()
  return data!.id as string
}

test.describe("Admin messages", () => {
  test("a customer's message: shown unread, read on opening, answered by email, marked unread, deleted", async ({ page, adminUser }) => {
    const tag = Date.now().toString(36)
    const name = `E2E Visitor ${tag}`
    const email = `e2e-inbox-${tag}@example.com`
    try {
      const id = await sendContactMessage(name, email, "am")

      await signIn(page, adminUser)
      await page.goto("/admin/messages")
      const nav = page.getByRole("navigation", { name: en.admin.nav.label })
      await expect(nav.getByRole("link", { name: new RegExp(`^${en.admin.nav.messages} \\(\\d+ unread\\)`) })).toBeVisible()

      // Unread: listed under the Unread filter.
      await page.getByRole("button", { name: new RegExp(`^${en.admin.messages.filterUnread}`) }).click()
      const row = page.getByRole("link", { name: new RegExp(name) })
      await expect(row).toContainText(`(${en.admin.messages.unread})`)
      await row.click()

      await expect(page.getByRole("heading", { level: 1, name: "Delivery to Hawassa" })).toBeVisible()
      await expect(page.getByText("Do you deliver to Hawassa?")).toBeVisible()
      await expect(page.getByText(en.admin.messages.language.replace("{language}", en.admin.messages.languageAm))).toBeVisible()
      await expect.poll(async () => (await admin().from("contact_messages").select("read_at").eq("id", id).single()).data?.read_at).not.toBeNull()

      // An empty reply is refused before it reaches the database.
      const send = page.getByRole("button", { name: en.admin.messages.send })
      await send.click()
      await expect(page.getByText(en.admin.messages.errors.replyLength)).toBeVisible()

      const box = page.getByLabel(en.admin.messages.replyLabel.replace("{name}", name))
      await box.fill("Yes, we deliver to Hawassa.\nIt takes 3 days.")
      await send.click()
      await expect(page.getByText(en.admin.messages.sent.replace("{email}", email))).toBeVisible()
      await expect(box).toHaveValue("")
      await expect(page.getByRole("heading", { name: en.admin.messages.replies })).toBeVisible()
      await expect(page.getByText("Yes, we deliver to Hawassa.")).toBeVisible()

      // Stored with the message, and queued for the customer in the language they wrote in.
      const { data: replies } = await admin().from("contact_replies").select("id, body, admin_id").eq("message_id", id)
      expect(replies).toMatchObject([{ body: "Yes, we deliver to Hawassa.\nIt takes 3 days.", admin_id: adminUser.id }])
      const { data: queued } = await admin().from("email_outbox").select("kind, locale, reply_id").eq("contact_id", id).order("created_at")
      expect(queued).toMatchObject([
        { kind: "contact", locale: "en", reply_id: null },
        { kind: "contact_reply", locale: "am", reply_id: replies![0].id },
      ])

      // Mark unread: back to the inbox, unread again.
      await page.getByRole("button", { name: en.admin.messages.markUnread }).click()
      await expect(page).toHaveURL(/\/admin\/messages$/)
      await expect(page.getByRole("link", { name: new RegExp(name) })).toContainText(`(${en.admin.messages.unread})`)
      await expect(page.getByRole("link", { name: new RegExp(name) })).toContainText(en.admin.messages.replied)

      // Delete, after confirming: the message, its replies and their emails go.
      await page.getByRole("link", { name: new RegExp(name) }).click()
      await page.getByRole("button", { name: en.admin.messages.delete }).click()
      const dialog = page.getByRole("dialog", { name: en.admin.messages.deleteTitle })
      await dialog.getByRole("button", { name: en.common.delete }).click()
      await expect(page).toHaveURL(/\/admin\/messages$/)
      await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0)
      expect((await admin().from("contact_messages").select("id").eq("id", id)).data).toEqual([])
      expect((await admin().from("contact_replies").select("id").eq("message_id", id)).data).toEqual([])
      expect((await admin().from("email_outbox").select("id").eq("contact_id", id)).data).toEqual([])

      // A message that no longer exists.
      await page.goto(`/admin/messages/${id}`)
      await expect(page.getByRole("heading", { level: 1, name: en.admin.messages.notFound })).toBeVisible()
    } finally {
      await admin().from("contact_messages").delete().eq("email", email)
    }
  })

  test("customers and visitors can't read, answer, mark or delete messages", async ({ shopper }) => {
    const email = `e2e-private-${Date.now().toString(36)}@example.com`
    try {
      const id = await sendContactMessage("E2E Private", email, "en")
      for (const client of [anonymousClient(), await clientFor(shopper)]) {
        expect((await client.from("contact_messages").select("id").eq("id", id)).data ?? []).toEqual([])
        expect((await client.from("contact_replies").select("id")).data ?? []).toEqual([])
        expect((await client.rpc("reply_to_contact_message", { p_message_id: id, p_body: "Hi" })).error).not.toBeNull()
        expect((await client.rpc("set_contact_message_read", { p_message_id: id, p_read: true })).error).not.toBeNull()
        await client.from("contact_messages").delete().eq("id", id)
      }
      const { data } = await admin().from("contact_messages").select("read_at").eq("id", id).single()
      expect(data).toEqual({ read_at: null })
      expect((await admin().from("contact_replies").select("id").eq("message_id", id)).data).toEqual([])
    } finally {
      await admin().from("contact_messages").delete().eq("email", email)
    }
  })
})
