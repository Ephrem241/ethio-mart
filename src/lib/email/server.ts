import nodemailer from "nodemailer"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { SITE_URL } from "@/lib/seo/site"
import { readEmailConfig, type EmailConfig } from "@/lib/email/config"
import { dispatchEmails, type DispatchResult, type Mailer, type Outbox } from "@/lib/email/dispatch"
import type { OutboxRow } from "@/lib/email/types"

// The real mailer (SMTP, e.g. Brevo) and the real outbox (the database, with
// the public key: the dispatch secret, not a privileged key, is what lets this
// server read the queue). Used only by the /api/email/dispatch route.

function createSmtpMailer(config: EmailConfig): Mailer {
  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    // Don't let one slow SMTP server hold the request open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return {
    async send(message) {
      await transport.sendMail({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      })
    },
  }
}

function createDatabaseOutbox(secret: string): Outbox {
  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return {
    async claim(limit) {
      const { data, error } = await supabase.rpc("claim_email_outbox", { p_secret: secret, p_limit: limit })
      if (error) throw new Error(`claim_email_outbox: ${error.message}`) // i18n-ignore: developer-facing
      return (data ?? []) as OutboxRow[]
    },
    async complete(id, sendError) {
      const { error } = await supabase.rpc("complete_email_outbox", { p_secret: secret, p_id: id, p_error: sendError })
      if (error) throw new Error(`complete_email_outbox: ${error.message}`) // i18n-ignore: developer-facing
    },
  }
}

export function emailConfigured(): boolean {
  return readEmailConfig().config !== null
}

// null when email isn't configured (everything stays queued).
export async function dispatchQueuedEmails(): Promise<DispatchResult | null> {
  const { config } = readEmailConfig()
  if (!config) return null
  return dispatchEmails({
    mailer: createSmtpMailer(config),
    outbox: createDatabaseOutbox(config.dispatchSecret),
    from: config.from,
    context: { siteUrl: SITE_URL, shopEmail: config.shopEmail },
  })
}
