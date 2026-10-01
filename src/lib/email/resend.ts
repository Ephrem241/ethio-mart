import type { Mailer } from "@/lib/email/dispatch"

// Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email):
// one HTTPS request per email, which suits a serverless host better than
// holding an SMTP connection open.
//
// Each email carries an Idempotency-Key made from its queue row, so if the
// email was sent but recording that failed, the retry (within Resend's
// 24 hours) is recognised as the same email and not delivered twice.

const RESEND_API = "https://api.resend.com"

export function createResendMailer(apiKey: string, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    async send(message) {
      const response = await fetchImpl(`${RESEND_API}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        // Don't let a slow API hold the request open.
        signal: AbortSignal.timeout(15_000),
      })
      if (response.ok) return

      // Resend explains failures as { statusCode, name, message }; keep the
      // status and its words (they end up in email_outbox.last_error).
      let detail = ""
      try {
        const body = (await response.json()) as { message?: unknown; name?: unknown }
        detail = [body.name, body.message].filter((part) => typeof part === "string" && part).join(": ")
      } catch {
        // not JSON
      }
      throw new Error(`Resend ${response.status}${detail ? ` ${detail}` : ""}`) // i18n-ignore: stored for the developer
    },
  }
}
