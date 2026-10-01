import { describe, expect, it } from "vitest"

import { readEmailConfig } from "@/lib/email/config"
import { dispatchEmails, isUndeliverable, type Mailer, type OutgoingMessage, type Outbox } from "@/lib/email/dispatch"
import { createResendMailer } from "@/lib/email/resend"
import { escapeHtml, renderEmail } from "@/lib/email/templates"
import type { OutboxOrder, OutboxRow } from "@/lib/email/types"
import { contactSchema } from "@/components/contact/contact-schema"

const ctx = { siteUrl: "https://evaelstore.et", shopEmail: "owner@evaelstore.et" }

const order: OutboxOrder = {
  id: "11111111-2222-3333-4444-555555555555",
  order_number: "ETM-20260930-AB12",
  status: "pending",
  payment_method: "cod",
  subtotal: 1200,
  delivery_fee: 150,
  discount: 0,
  total: 1350,
  delivery_address: { full_name: "Abebe Kebede", phone: "0911223344", city: "Adama", sub_city: "Kebele 2", woreda: "05", address: "Near the market" },
  created_at: "2026-09-30T10:00:00Z",
  customer_name: "Abebe Kebede",
  customer_email: "abebe@mail.et",
  items: [
    { name: "Canvas Tote Bag", quantity: 2, unit_price: 400, total: 800 },
    { name: "Ceramic Mug <b>Set</b>", quantity: 1, unit_price: 400, total: 400 },
  ],
}

const row = (overrides: Partial<OutboxRow>): OutboxRow => ({ id: "r1", kind: "order_confirmation", status: null, locale: "en", order, contact: null, ...overrides })

describe("email templates", () => {
  it("order confirmation: to the customer, with the number, items, totals, address and a link", () => {
    const email = renderEmail(row({}), ctx)!
    expect(email.to).toBe("abebe@mail.et")
    expect(email.subject).toBe("Order ETM-20260930-AB12 received — Evael Store")
    for (const text of ["Canvas Tote Bag", "1,350 ETB", "150 ETB", "Near the market", "Cash on delivery", `${ctx.siteUrl}/orders/${order.id}`]) {
      expect(email.html).toContain(text)
      expect(email.text).toContain(text)
    }
  })

  it("is written in the customer's language", () => {
    const email = renderEmail(row({ locale: "am" }), ctx)!
    expect(email.subject).toBe("ትዕዛዝ ETM-20260930-AB12 ደርሶናል — Evael Store")
    expect(email.html).toContain('lang="am"')
    expect(email.html).toContain("1,350 ብር")
  })

  it("free delivery says so", () => {
    expect(renderEmail(row({ order: { ...order, delivery_fee: 0 } }), ctx)!.text).toContain("Delivery: Free")
  })

  it("escapes everything a customer typed", () => {
    const email = renderEmail(row({ order: { ...order, customer_name: '<script>alert("x")</script>' } }), ctx)!
    expect(email.html).not.toContain("<script>")
    expect(email.html).toContain("&lt;script&gt;")
    expect(email.html).toContain("Ceramic Mug &lt;b&gt;Set&lt;/b&gt;")
    expect(escapeHtml(`a&b"'`)).toBe("a&amp;b&quot;&#39;")
  })

  it("status updates: one per customer-facing status, in their language; none for other statuses", () => {
    const shipped = renderEmail(row({ kind: "order_status", status: "shipped" }), ctx)!
    expect(shipped.subject).toBe("Order ETM-20260930-AB12: Shipped")
    expect(shipped.text).toContain("is on its way")
    const cancelled = renderEmail(row({ kind: "order_status", status: "cancelled", locale: "am" }), ctx)!
    expect(cancelled.subject).toBe("ትዕዛዝ ETM-20260930-AB12፦ ተሰርዟል")
    expect(renderEmail(row({ kind: "order_status", status: "preparing" }), ctx)).toBeNull()
  })

  it("new-order alert: to the shop, in English, reply-to the customer, linking to the admin", () => {
    const email = renderEmail(row({ kind: "order_alert", locale: "am" }), ctx)!
    expect(email.to).toBe(ctx.shopEmail)
    expect(email.replyTo).toBe("abebe@mail.et")
    expect(email.subject).toBe("New order ETM-20260930-AB12 — 1,350 ETB")
    expect(email.html).toContain(`${ctx.siteUrl}/admin/orders/${order.id}`)
  })

  it("contact message: to the shop, reply-to the sender, the message kept with its line breaks and escaped", () => {
    const contact = { name: "Sara", email: "sara@mail.et", subject: "Delivery\r\nBcc: x@evil.test", message: "Hello,\n<i>when</i> will it come?", created_at: "2026-09-30T10:00:00Z" }
    const email = renderEmail(row({ kind: "contact", order: null, contact }), ctx)!
    expect(email.to).toBe(ctx.shopEmail)
    expect(email.replyTo).toBe("sara@mail.et")
    expect(email.subject).toBe("Contact form: Delivery Bcc: x@evil.test")
    expect(email.subject).not.toMatch(/[\r\n]/)
    expect(email.html).toContain("Hello,<br>&lt;i&gt;when&lt;/i&gt; will it come?")
    expect(renderEmail(row({ kind: "contact", order: null, contact: { ...contact, subject: null } }), ctx)!.subject).toBe("Contact form: (no subject)")
  })

  it("nothing to send when the order is gone or has no address", () => {
    expect(renderEmail(row({ order: null }), ctx)).toBeNull()
    expect(renderEmail(row({ order: { ...order, customer_email: null } }), ctx)).toBeNull()
  })
})

describe("email dispatch", () => {
  function fakes(rows: OutboxRow[], failFor: string[] = []) {
    const sent: OutgoingMessage[] = []
    const completed: [string, string | null][] = []
    let queue = [...rows]
    const mailer: Mailer = {
      async send(message) {
        if (failFor.includes(message.to)) throw new Error("550 mailbox unavailable")
        sent.push(message)
      },
    }
    const outbox: Outbox = {
      async claim(limit) {
        const batch = queue.slice(0, limit)
        queue = queue.slice(limit)
        return batch
      },
      async complete(id, error) {
        completed.push([id, error])
      },
    }
    return { mailer, outbox, sent, completed }
  }

  it("sends each queued email from the shop's address and settles it", async () => {
    const f = fakes([row({ id: "a" }), row({ id: "b", kind: "order_alert" })])
    const result = await dispatchEmails({ mailer: f.mailer, outbox: f.outbox, from: "Evael Store <orders@evaelstore.et>", context: ctx })
    expect(result).toEqual({ sent: 2, failed: 0, skipped: 0 })
    expect(f.sent.map((m) => [m.to, m.from])).toEqual([
      ["abebe@mail.et", "Evael Store <orders@evaelstore.et>"],
      [ctx.shopEmail, "Evael Store <orders@evaelstore.et>"],
    ])
    expect(f.completed).toEqual([["a", null], ["b", null]])
  })

  it("records a failed send so it is retried, and carries on with the rest", async () => {
    const f = fakes([row({ id: "a" }), row({ id: "b", kind: "order_alert" })], ["abebe@mail.et"])
    const result = await dispatchEmails({ mailer: f.mailer, outbox: f.outbox, from: "x@evaelstore.et", context: ctx })
    expect(result).toEqual({ sent: 1, failed: 1, skipped: 0 })
    expect(f.completed).toEqual([["a", "550 mailbox unavailable"], ["b", null]])
  })

  it("never mails test addresses (and not the owner about a test order), but settles them", async () => {
    const testOrder = { ...order, customer_email: "e2e-shopper-1@example.com" }
    const f = fakes([row({ id: "a", order: testOrder }), row({ id: "b", kind: "order_alert", order: testOrder }), row({ id: "c", order: null })])
    const result = await dispatchEmails({ mailer: f.mailer, outbox: f.outbox, from: "x@evaelstore.et", context: ctx })
    expect(result).toEqual({ sent: 0, failed: 0, skipped: 3 })
    expect(f.completed.map(([id, error]) => [id, error])).toEqual([["a", null], ["b", null], ["c", null]])
  })

  it("works through more than one batch", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ id: `r${i}` }))
    const f = fakes(rows)
    const result = await dispatchEmails({ mailer: f.mailer, outbox: f.outbox, from: "x@evaelstore.et", context: ctx, batchSize: 5 })
    expect(result.sent).toBe(12)
  })

  it.each(["a@example.com", "b@sub.example.org", "c@shop.test", "d@x.invalid", "e@localhost", "", null])("treats %j as undeliverable", (address) => {
    expect(isUndeliverable(address)).toBe(true)
  })

  it.each(["abebe@mail.et", "owner@gmail.com", "x@notexample.com"])("delivers to %j", (address) => {
    expect(isUndeliverable(address)).toBe(false)
  })
})

describe("email settings", () => {
  const key = ["re", "notarealkey123"].join("_")
  const full = {
    RESEND_API_KEY: key,
    EMAIL_FROM: "Evael Store <orders@evaelstore.et>",
    SHOP_NOTIFY_EMAIL: "owner@evaelstore.et",
    EMAIL_DISPATCH_SECRET: "y".repeat(48),
  }

  it("reads a complete configuration", () => {
    expect(readEmailConfig(full).config).toEqual({
      resendApiKey: key,
      from: "Evael Store <orders@evaelstore.et>",
      shopEmail: "owner@evaelstore.et",
      dispatchSecret: "y".repeat(48),
    })
  })

  it("is off, naming what is missing, when anything is missing or wrong", () => {
    expect(readEmailConfig({}).missing).toHaveLength(4)
    expect(readEmailConfig({ ...full, RESEND_API_KEY: " " })).toEqual({ config: null, missing: ["RESEND_API_KEY"] })
    expect(readEmailConfig({ ...full, RESEND_API_KEY: "an-smtp-password" }).missing[0]).toContain("starts with re_")
    expect(readEmailConfig({ ...full, EMAIL_DISPATCH_SECRET: "short" }).missing[0]).toContain("EMAIL_DISPATCH_SECRET")
  })
})

describe("Resend mailer", () => {
  const message = {
    from: "Evael Store <orders@evaelstore.et>",
    to: "owner@evaelstore.et",
    replyTo: "sara@mail.et",
    subject: "Contact form: hi",
    html: "<p>hi</p>",
    text: "hi",
    idempotencyKey: "email-outbox-r1",
  }

  function fakeFetch(response: { status: number; body?: unknown }) {
    const calls: { url: string; init: RequestInit }[] = []
    const impl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(response.body === undefined ? null : JSON.stringify(response.body), { status: response.status })
    }) as unknown as typeof fetch
    return { impl, calls }
  }

  it("posts the email to Resend with the key, the reply-to and an idempotency key", async () => {
    const f = fakeFetch({ status: 200, body: { id: "49a3999c" } })
    await createResendMailer("re_test", f.impl).send(message)
    expect(f.calls).toHaveLength(1)
    const { url, init } = f.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_test", "Content-Type": "application/json", "Idempotency-Key": "email-outbox-r1" })
    expect(JSON.parse(String(init.body))).toEqual({
      from: message.from,
      to: ["owner@evaelstore.et"],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: "sara@mail.et",
    })
  })

  it("leaves reply_to out when there is none", async () => {
    const f = fakeFetch({ status: 200, body: { id: "x" } })
    await createResendMailer("re_test", f.impl).send({ ...message, replyTo: undefined })
    expect(JSON.parse(String(f.calls[0].init.body))).not.toHaveProperty("reply_to")
  })

  it("throws Resend's own explanation on failure, so it is recorded and retried", async () => {
    const forbidden = fakeFetch({ status: 403, body: { statusCode: 403, name: "validation_error", message: "The evaelstore.et domain is not verified." } })
    await expect(createResendMailer("re_test", forbidden.impl).send(message)).rejects.toThrow(
      "Resend 403 validation_error: The evaelstore.et domain is not verified."
    )
    const busy = fakeFetch({ status: 429 })
    await expect(createResendMailer("re_test", busy.impl).send(message)).rejects.toThrow("Resend 429")
  })

  it("the dispatcher gives every attempt at one queued email the same idempotency key", async () => {
    const sent: string[] = []
    const mailer = { async send(m: OutgoingMessage) { sent.push(m.idempotencyKey!) } }
    const rows = [row({ id: "abc" })]
    const outbox: Outbox = { claim: async () => rows.splice(0), complete: async () => {} }
    await dispatchEmails({ mailer, outbox, from: "x@evaelstore.et", context: ctx })
    expect(sent).toEqual(["email-outbox-abc"])
  })
})

describe("contact form rules", () => {
  const good = { name: "Sara", email: "sara@mail.et", subject: "", message: "When will my order arrive?", website: "" }
  const errorsOf = (values: object) => {
    const result = contactSchema.safeParse(values)
    return result.success ? [] : result.error.issues.map((i) => i.path.join("."))
  }

  it("accepts a normal message, with or without a subject", () => {
    expect(errorsOf(good)).toEqual([])
    expect(errorsOf({ ...good, subject: "Delivery" })).toEqual([])
  })

  it("matches the database's limits", () => {
    expect(errorsOf({ ...good, name: " " })).toEqual(["name"])
    expect(errorsOf({ ...good, email: "sara@" })).toEqual(["email"])
    expect(errorsOf({ ...good, message: "Too short" })).toEqual(["message"])
    expect(errorsOf({ ...good, message: "x".repeat(3001) })).toEqual(["message"])
    expect(errorsOf({ ...good, subject: "x".repeat(151) })).toEqual(["subject"])
  })
})
