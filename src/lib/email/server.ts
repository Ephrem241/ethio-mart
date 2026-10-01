import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { SITE_URL } from "@/lib/seo/site"
import { readEmailConfig } from "@/lib/email/config"
import { dispatchEmails, type DispatchResult, type Outbox } from "@/lib/email/dispatch"
import { createResendMailer } from "@/lib/email/resend"
import type { OutboxRow } from "@/lib/email/types"

// The real mailer (Resend's API) and the real outbox (the database, with
// the public key: the dispatch secret, not a privileged key, is what lets this
// server read the queue). Used only by the /api/email/dispatch route.

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
    mailer: createResendMailer(config.resendApiKey),
    outbox: createDatabaseOutbox(config.dispatchSecret),
    from: config.from,
    context: { siteUrl: SITE_URL, shopEmail: config.shopEmail },
  })
}
