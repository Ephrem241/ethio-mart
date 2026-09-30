import { renderEmail, type EmailContext } from "@/lib/email/templates"
import type { OutboxRow, RenderedEmail } from "@/lib/email/types"

// Sends what is queued in the database's email outbox (migration 0019):
// claim a batch, write and send each email, settle each one. The mailer and
// the outbox are passed in (SMTP and Supabase in production, fakes in tests).
// A failed send is recorded and the email goes back in the queue, so the next
// dispatch retries it (the database gives up after 5 attempts).

export interface OutgoingMessage extends RenderedEmail {
  from: string
}

export interface Mailer {
  send(message: OutgoingMessage): Promise<void>
}

export interface Outbox {
  claim(limit: number): Promise<OutboxRow[]>
  complete(id: string, error: string | null): Promise<void>
}

export interface DispatchResult {
  sent: number
  failed: number
  skipped: number
}

// Addresses that can never receive mail (RFC 2606 / 6761), such as the test
// suite's e2e-…@example.com accounts. Sending to them would only bounce and
// hurt the shop's sender reputation, so those emails are settled unsent.
const RESERVED = /@(?:[^@]*\.)?(example\.(?:com|org|net)|[^@]+\.(?:test|invalid|example|localhost)|localhost)$/i

export function isUndeliverable(address: string | null | undefined): boolean {
  return !address || RESERVED.test(address.trim())
}

// The address that decides whether a row is test traffic: the customer for
// order emails (including the owner's alert about a test order), the sender
// for contact messages.
function originAddress(row: OutboxRow): string | null {
  if (row.kind === "contact") return row.contact?.email ?? null
  return row.order?.customer_email ?? null
}

export async function dispatchEmails({
  mailer,
  outbox,
  from,
  context,
  batchSize = 10,
  maxBatches = 3,
}: {
  mailer: Mailer
  outbox: Outbox
  from: string
  context: EmailContext
  batchSize?: number
  maxBatches?: number
}): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, skipped: 0 }

  for (let batch = 0; batch < maxBatches; batch++) {
    const rows = await outbox.claim(batchSize)
    for (const row of rows) {
      const email = isUndeliverable(originAddress(row)) ? null : renderEmail(row, context)
      if (!email || isUndeliverable(email.to)) {
        await outbox.complete(row.id, null)
        result.skipped++
        continue
      }
      try {
        await mailer.send({ ...email, from })
        await outbox.complete(row.id, null)
        result.sent++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await outbox.complete(row.id, message || "send failed")
        result.failed++
      }
    }
    if (rows.length < batchSize) break
  }
  return result
}
