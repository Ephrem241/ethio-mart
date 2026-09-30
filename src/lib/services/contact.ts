import { translateDbError } from "@/lib/i18n/db-errors"
import { requestEmailDispatch } from "@/lib/services/email-ping"
import type { Locale } from "@/lib/i18n/config"

// The contact form's message goes through the database's
// submit_contact_message (0019): it checks the fields again, limits how often
// one address (and everyone together) can send, stores the message and queues
// the email to the shop. The ping then sends it at once.
export async function submitContactMessage(
  input: { name: string; email: string; subject: string; message: string },
  locale: Locale
): Promise<{ success: true } | { success: false; error: string }> {
  // Loaded on demand, like the newsletter: most visitors to the Contact page
  // never send a message.
  const { createClient } = await import("@/lib/supabase/client")
  const { error } = await createClient().rpc("submit_contact_message", {
    p_name: input.name,
    p_email: input.email,
    p_subject: input.subject,
    p_message: input.message,
    p_locale: locale,
  })
  if (error) return { success: false, error: translateDbError(error.message) }
  requestEmailDispatch()
  return { success: true }
}
