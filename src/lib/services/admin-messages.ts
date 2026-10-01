import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"
import { translateDbError } from "@/lib/i18n/db-errors"
import { requestEmailDispatch } from "@/lib/services/email-ping"
import type { Locale } from "@/lib/i18n/config"

// The admin's Messages inbox: what customers sent through the Contact page
// (0019), and the admin's email answers to them (0020). Admins READ messages
// and replies through RLS; marking read and replying go through the
// database's own functions, which check is_admin() themselves. A reply is
// queued in the email outbox like every other email and the ping sends it.

export interface ContactReply {
  id: string
  body: string
  createdAt: string
  adminName: string | null
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  locale: Locale
  createdAt: string
  readAt: string | null
  replies: ContactReply[] // oldest first
}

interface MessageRow {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  locale: string
  created_at: string
  read_at: string | null
  replies: { id: string; body: string; created_at: string; admin: { full_name: string } | null }[] | null
}

type Result = { success: true } | { success: false; error: string }

const COLUMNS =
  "id, name, email, subject, message, locale, created_at, read_at, replies:contact_replies(id, body, created_at, admin:profiles(full_name))"

function toMessage(row: MessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    locale: row.locale === "am" ? "am" : "en",
    createdAt: row.created_at,
    readAt: row.read_at,
    replies: (row.replies ?? [])
      .map((reply) => ({
        id: reply.id,
        body: reply.body,
        createdAt: reply.created_at,
        adminName: reply.admin?.full_name ?? null,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}

// Newest first.
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await createClient()
    .from("contact_messages")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Failed to load messages: ${error.message}`) // i18n-ignore: developer-facing
  return (data as unknown as MessageRow[]).map(toMessage)
}

// null when there is no such message (or it was deleted).
export async function fetchContactMessage(id: string): Promise<ContactMessage | null> {
  const { data, error } = await createClient().from("contact_messages").select(COLUMNS).eq("id", id).maybeSingle()
  if (error) {
    // A malformed id in the URL is "not found", not a failure.
    if (error.code === "22P02") return null
    throw new Error(`Failed to load message: ${error.message}`) // i18n-ignore: developer-facing
  }
  return data ? toMessage(data as unknown as MessageRow) : null
}

export async function countUnreadMessages(): Promise<number> {
  const { count, error } = await createClient()
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
  if (error) throw new Error(`Failed to count messages: ${error.message}`) // i18n-ignore: developer-facing
  return count ?? 0
}

// The admin nav's unread badge listens for this, so it updates the moment a
// message is read, answered or deleted on another part of the page.
export const MESSAGES_CHANGED_EVENT = "admin-messages-changed"

function announceChange(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT))
}

export async function setMessageRead(id: string, read: boolean): Promise<Result> {
  const { error } = await createClient().rpc("set_contact_message_read", { p_message_id: id, p_read: read })
  if (error) return { success: false, error: translateDbError(error.message) }
  announceChange()
  return { success: true }
}

// Stores the answer with the message and emails it to the customer.
export async function replyToMessage(id: string, body: string): Promise<Result> {
  const { error } = await createClient().rpc("reply_to_contact_message", { p_message_id: id, p_body: body })
  if (error) return { success: false, error: translateDbError(error.message) }
  requestEmailDispatch()
  announceChange()
  return { success: true }
}

export async function deleteMessage(id: string): Promise<Result> {
  const { data, error } = await createClient().from("contact_messages").delete().eq("id", id).select("id")
  if (error) return { success: false, error: translateDbError(error.message) }
  // RLS refuses a non-admin's delete as zero rows, not as an error.
  if (!data || data.length === 0) return { success: false, error: translate("errors.notAllowed") }
  announceChange()
  return { success: true }
}
