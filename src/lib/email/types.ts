import type { Locale } from "@/lib/i18n/config"

// One queued email as claim_email_outbox (migration 0019) hands it over, with
// everything needed to write it.
export type EmailKind = "order_confirmation" | "order_alert" | "order_status" | "contact" | "contact_reply"

export interface OutboxOrder {
  id: string
  order_number: string
  status: string
  payment_method: string
  subtotal: number | string
  delivery_fee: number | string
  discount: number | string
  total: number | string
  delivery_address: {
    full_name?: string
    phone?: string
    city?: string
    sub_city?: string
    woreda?: string
    address?: string
  }
  created_at: string
  customer_name: string | null
  customer_email: string | null
  items: { name: string; quantity: number; unit_price: number | string; total: number | string }[]
}

export interface OutboxContact {
  name: string
  email: string
  subject: string | null
  message: string
  // The language they wrote in (0020 onwards; older rows may lack it).
  locale?: Locale
  created_at: string
}

// contact_reply only: the admin's answer (0020).
export interface OutboxReply {
  body: string
  created_at: string
}

export interface OutboxRow {
  id: string
  kind: EmailKind
  // order_status only: the status the order moved to.
  status: string | null
  locale: Locale
  order: OutboxOrder | null
  contact: OutboxContact | null
  reply?: OutboxReply | null
}

export interface RenderedEmail {
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
}
