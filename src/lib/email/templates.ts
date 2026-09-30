import { BRAND_NAME } from "@/lib/brand"
import { formatPrice } from "@/lib/currency"
import type { Locale } from "@/lib/i18n/config"
import { createTranslator, type MessageKey, type Translator } from "@/lib/i18n/translator"
import { en } from "@/locales/en"
import { am } from "@/locales/am"
import type { OutboxContact, OutboxOrder, OutboxRow, RenderedEmail } from "@/lib/email/types"

// The store's emails, as HTML (a simple table layout that survives Gmail,
// Outlook and phone mail apps, styles inline) plus a plain-text copy. The
// customer's emails are in their language; the owner's always in English.
// Everything a customer or visitor typed is HTML-escaped.

export interface EmailContext {
  siteUrl: string
  shopEmail: string
}

const COLORS = {
  page: "#FAF7F0",
  card: "#FFFFFF",
  band: "#092A25",
  gold: "#C9A15B",
  text: "#171717",
  muted: "#6B665F",
  line: "#E3D2BD",
  button: "#123C35",
}

const translators: Record<Locale, Translator> = {
  en: createTranslator("en", en),
  am: createTranslator("am", am),
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const money = (amount: number | string, t: Translator) => formatPrice(Number(amount), t)

// ---------------------------------------------------------------------------
// Building blocks. Each returns [html, text].
// ---------------------------------------------------------------------------
type Part = [string, string]

function paragraph(text: string): Part {
  return [`<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLORS.text}">${escapeHtml(text)}</p>`, text]
}

function button(label: string, href: string): Part {
  return [
    `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:${COLORS.button};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${escapeHtml(label)}</a></p>`,
    `${label}: ${href}`,
  ]
}

function orderTable(order: OutboxOrder, t: Translator): Part {
  const cell = `padding:8px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.text}`
  const head = `padding:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.muted};text-align:left`
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="${cell}">${escapeHtml(item.name)}</td><td style="${cell};text-align:center">${item.quantity}</td><td style="${cell};text-align:right;white-space:nowrap">${escapeHtml(money(item.total, t))}</td></tr>`
    )
    .join("")
  const delivery = Number(order.delivery_fee) === 0 ? t("email.free") : money(order.delivery_fee, t)
  const totals: [string, string, boolean][] = [
    [t("email.subtotal"), money(order.subtotal, t), false],
    [t("email.delivery"), delivery, false],
    ...(Number(order.discount) > 0 ? [[t("email.discount"), `−${money(order.discount, t)}`, false] as [string, string, boolean]] : []),
    [t("email.total"), money(order.total, t), true],
  ]
  const totalRows = totals
    .map(
      ([label, value, strong]) =>
        `<tr><td colspan="2" style="padding:6px 0;font-size:14px;color:${strong ? COLORS.text : COLORS.muted};${strong ? "font-weight:700" : ""}">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;text-align:right;white-space:nowrap;color:${COLORS.text};${strong ? "font-weight:700" : ""}">${escapeHtml(value)}</td></tr>`
    )
    .join("")

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 20px">
<tr><th style="${head}">${escapeHtml(t("email.item"))}</th><th style="${head};text-align:center">${escapeHtml(t("email.quantity"))}</th><th style="${head};text-align:right">${escapeHtml(t("email.amount"))}</th></tr>
${rows}
${totalRows}
</table>`

  const text = [
    ...order.items.map((item) => `- ${item.name} × ${item.quantity}: ${money(item.total, t)}`),
    "",
    ...totals.map(([label, value]) => `${label}: ${value}`),
  ].join("\n")
  return [html, text]
}

function facts(entries: [string, string][]): Part {
  const html = entries
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${COLORS.text}"><span style="display:block;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(label)}</span>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`
    )
    .join("")
  return [html, entries.map(([label, value]) => `${label}:\n${value}`).join("\n\n")]
}

function addressLines(order: OutboxOrder): string {
  const a = order.delivery_address ?? {}
  return [a.full_name, a.phone, a.address, [a.woreda, a.sub_city].filter(Boolean).join(", "), a.city]
    .filter((line) => line && String(line).trim())
    .join("\n")
}

function layout(locale: Locale, heading: string, parts: Part[], t: Translator): { html: string; text: string } {
  const font =
    locale === "am"
      ? "'Noto Sans Ethiopic','Nyala','Abyssinica SIL',Arial,sans-serif"
      : "-apple-system,'Segoe UI',Roboto,Arial,sans-serif"
  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.page}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLORS.card};border-radius:16px;overflow:hidden;font-family:${font}">
<tr><td style="background:${COLORS.band};padding:20px 28px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.04em;color:${COLORS.gold}">${escapeHtml(BRAND_NAME)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${COLORS.text}">${escapeHtml(heading)}</h1>
${parts.map(([partHtml]) => partHtml).join("\n")}
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid ${COLORS.line};font-size:12px;line-height:1.5;color:${COLORS.muted}">${escapeHtml(t("email.footer", { brand: BRAND_NAME }))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
  const text = [heading, "", ...parts.map(([, partText]) => partText).flatMap((p) => [p, ""]), "—", t("email.footer", { brand: BRAND_NAME })].join("\n")
  return { html, text }
}

// ---------------------------------------------------------------------------
// The four emails.
// ---------------------------------------------------------------------------
function confirmation(order: OutboxOrder, locale: Locale, ctx: EmailContext): RenderedEmail | null {
  if (!order.customer_email) return null
  const t = translators[locale]
  const heading = t("email.confirmation.heading")
  const parts: Part[] = [
    paragraph(t("email.greeting", { name: order.customer_name || order.delivery_address?.full_name || "" })),
    paragraph(t("email.confirmation.intro", { number: order.order_number })),
    orderTable(order, t),
    facts([
      [t("email.orderNumber"), order.order_number],
      [t("email.deliverTo"), addressLines(order)],
      [t("email.payment"), t("email.cod")],
    ]),
    button(t("email.viewOrder"), `${ctx.siteUrl}/orders/${order.id}`),
    paragraph(t("email.signoff", { brand: BRAND_NAME })),
  ]
  return {
    to: order.customer_email,
    subject: t("email.confirmation.subject", { number: order.order_number, brand: BRAND_NAME }),
    ...layout(locale, heading, parts, t),
  }
}

const STATUS_EMAILS = ["confirmed", "shipped", "delivered", "cancelled"] as const
type StatusEmail = (typeof STATUS_EMAILS)[number]

function statusUpdate(order: OutboxOrder, status: string | null, locale: Locale, ctx: EmailContext): RenderedEmail | null {
  if (!order.customer_email || !STATUS_EMAILS.includes(status as StatusEmail)) return null
  const t = translators[locale]
  const statusName = t(`order.status.${status}` as MessageKey)
  const parts: Part[] = [
    paragraph(t("email.greeting", { name: order.customer_name || order.delivery_address?.full_name || "" })),
    paragraph(t(`email.status.${status as StatusEmail}`, { number: order.order_number })),
    ...(status === "cancelled" ? [] : [orderTable(order, t)]),
    button(t("email.viewOrder"), `${ctx.siteUrl}/orders/${order.id}`),
    paragraph(t("email.signoff", { brand: BRAND_NAME })),
  ]
  return {
    to: order.customer_email,
    subject: t("email.status.subject", { number: order.order_number, status: statusName }),
    ...layout(locale, t("email.status.heading", { status: statusName }), parts, t),
  }
}

function orderAlert(order: OutboxOrder, ctx: EmailContext): RenderedEmail {
  const t = translators.en
  const name = order.customer_name || order.delivery_address?.full_name || "—"
  const parts: Part[] = [
    paragraph(t("email.alert.intro", { name, email: order.customer_email ?? "—", number: order.order_number })),
    orderTable(order, t),
    facts([
      [t("email.deliverTo"), addressLines(order)],
      [t("email.payment"), t("email.cod")],
    ]),
    button(t("email.alert.open"), `${ctx.siteUrl}/admin/orders/${order.id}`),
  ]
  return {
    to: ctx.shopEmail,
    ...(order.customer_email ? { replyTo: order.customer_email } : {}),
    subject: t("email.alert.subject", { number: order.order_number, total: money(order.total, t) }),
    ...layout("en", t("email.alert.heading"), parts, t),
  }
}

function contactMessage(contact: OutboxContact, ctx: EmailContext): RenderedEmail {
  const t = translators.en
  // One line: it goes into the Subject header.
  const subject = contact.subject?.replace(/\s+/g, " ").trim() || t("email.contact.noSubject")
  const parts: Part[] = [
    facts([[t("email.contact.from"), `${contact.name} <${contact.email}>`]]),
    [
      `<div style="margin:0 0 20px;padding:16px;border-radius:12px;background:${COLORS.page};font-size:15px;line-height:1.6;color:${COLORS.text}">${escapeHtml(contact.message).replace(/\n/g, "<br>")}</div>`,
      contact.message,
    ],
    paragraph(t("email.contact.replyHint", { name: contact.name })),
  ]
  return {
    to: ctx.shopEmail,
    replyTo: contact.email,
    subject: t("email.contact.subject", { subject }),
    ...layout("en", t("email.contact.heading"), parts, t),
  }
}

// null = nothing to send (the order or message is gone, or has no address).
export function renderEmail(row: OutboxRow, ctx: EmailContext): RenderedEmail | null {
  const locale: Locale = row.locale === "am" ? "am" : "en"
  switch (row.kind) {
    case "order_confirmation":
      return row.order ? confirmation(row.order, locale, ctx) : null
    case "order_status":
      return row.order ? statusUpdate(row.order, row.status, locale, ctx) : null
    case "order_alert":
      return row.order ? orderAlert(row.order, ctx) : null
    case "contact":
      return row.contact ? contactMessage(row.contact, ctx) : null
    default:
      return null
  }
}
