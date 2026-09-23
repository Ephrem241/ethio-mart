import { createClient } from "@/lib/supabase/client"

// Signups go through the database's subscribe_to_newsletter function (0012):
// it validates and lower-cases the address and ignores repeats, so a
// duplicate signup looks identical to a new one. Visitors have no read access
// to the subscriber list. Sending mail is still a separate, unbuilt concern —
// a real provider (Mailchimp/Resend/etc.) would read from this table.
export async function subscribeToNewsletter(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await createClient().rpc("subscribe_to_newsletter", { p_email: email })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
