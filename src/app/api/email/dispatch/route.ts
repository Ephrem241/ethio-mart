import { after, NextResponse, type NextRequest } from "next/server"

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config"
import { createClient } from "@/lib/supabase/server"
import { dispatchQueuedEmails, emailConfigured } from "@/lib/email/server"

// "Send what's queued." The database queues every email itself (order
// placed, status changed, contact message: migration 0019); the browser pings
// this route right after such an action so the email goes out at once, and any
// later ping (or an optional cron, see README) sends whatever an earlier one
// couldn't. Anyone may call it: it only ever sends what is already queued, and
// it answers with counts, never content.
//
// The checkout also sends `{ orderId, locale }`: the shopper's language (or,
// failing that, their `locale` cookie) is then recorded on the order first, so
// their order emails are written in it. The database accepts that only from
// the order's owner.
//
// It answers at once; the sending happens after the response (`after`), so the
// shopper never waits on the mail server.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { orderId?: unknown; locale?: unknown } | null
  const orderId = typeof body?.orderId === "string" && UUID.test(body.orderId) ? body.orderId : null

  if (orderId) {
    const locale = isLocale(body?.locale) ? body.locale : request.cookies.get(LOCALE_COOKIE)?.value
    if (isLocale(locale) && locale !== "en") {
      const supabase = await createClient()
      const { error } = await supabase.rpc("set_order_locale", { p_order_id: orderId, p_locale: locale })
      if (error) console.error(`set_order_locale: ${error.message}`) // i18n-ignore: developer-facing
    }
  }

  if (!emailConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 })
  }

  after(async () => {
    try {
      const result = await dispatchQueuedEmails()
      if (result && (result.sent || result.failed)) console.info(`email dispatch: ${JSON.stringify(result)}`) // i18n-ignore: server log
    } catch (error) {
      console.error("email dispatch failed:", error instanceof Error ? error.message : error) // i18n-ignore: server log
    }
  })
  return NextResponse.json({ configured: true }, { status: 202 })
}
