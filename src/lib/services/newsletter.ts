import { translateDbError } from "@/lib/i18n/db-errors"

// Signups go through the database's subscribe_to_newsletter function (0012):
// it validates and lower-cases the address and ignores repeats, so a
// duplicate signup looks identical to a new one. Visitors have no read access
// to the subscriber list. Sending mail is still a separate, unbuilt concern —
// a real provider (Mailchimp/Resend/etc.) would read from this table.
export async function subscribeToNewsletter(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  // Loaded on demand: the Supabase client is ~65KB of JavaScript that a
  // visitor who never subscribes should not download with the home page.
  const { createClient } = await import("@/lib/supabase/client")
  const { error } = await createClient().rpc("subscribe_to_newsletter", { p_email: email })
  if (error) {
    // The database's own wording is English; show ours.
    return { success: false, error: translateDbError(error.message) }
  }
  return { success: true }
}
