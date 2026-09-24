import { createClient } from "@/lib/supabase/client"
import { translateDbError } from "@/lib/i18n/db-errors"
import { translate } from "@/lib/i18n/translate"
import { ORDER_STATUSES } from "@/lib/order-status"
import type { OrderItemRecord, OrderRecord, OrderStatus } from "@/lib/types/orders"

// Real order reads and status changes against Postgres. Who can see what is
// enforced by the database (RLS), not by this file: a customer's queries can
// only ever return their own orders; an admin's return everyone's; and only
// an admin's UPDATE is accepted at all.

interface OrderRow extends Omit<OrderRecord, "items"> {
  order_items: OrderItemRecord[] | null
}

const ORDER_SELECT = "*, order_items(*)"

export function toOrderRecord(row: OrderRow): OrderRecord {
  const { order_items, ...order } = row
  return { ...order, items: order_items ?? [] }
}

const NEWEST_FIRST = { ascending: false } as const

export async function fetchMyOrders(userId: string): Promise<OrderRecord[]> {
  const { data, error } = await createClient()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", NEWEST_FIRST)

  if (error) throw new Error(`Failed to load orders: ${error.message}`) // i18n-ignore: developer-facing
  return (data as OrderRow[]).map(toOrderRecord)
}

// Admin only in practice — for anyone else RLS narrows this to their own.
export async function fetchAllOrders(): Promise<OrderRecord[]> {
  const { data, error } = await createClient()
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", NEWEST_FIRST)

  if (error) throw new Error(`Failed to load orders: ${error.message}`) // i18n-ignore: developer-facing
  return (data as OrderRow[]).map(toOrderRecord)
}

export async function fetchOrder(orderId: string): Promise<OrderRecord | null> {
  const { data, error } = await createClient()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle()

  // A malformed id (not a UUID) is "no such order", not a crash.
  if (error?.code === "22P02") return null
  if (error) throw new Error(`Failed to load order: ${error.message}`) // i18n-ignore: developer-facing
  return data ? toOrderRecord(data as OrderRow) : null
}

export type UpdateOrderStatusResult =
  | { success: true; order: OrderRecord }
  | { success: false; error: string }

// Section 31 lists the six statuses as a flat set an admin "can change" an
// order to, not a mandated sequence — skipping stages is a real operator
// correcting a step, so it's allowed. The rules that DO apply (delivered /
// cancelled are terminal; a no-op change is rejected; the timeline entry is
// appended) live in a Postgres trigger, so they can't be bypassed by calling
// the REST API directly. Its (English) error text is shown translated.
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
): Promise<UpdateOrderStatusResult> {
  if (!ORDER_STATUSES.includes(nextStatus)) {
    return { success: false, error: translate("order.errors.invalidStatus") }
  }

  const { data, error } = await createClient()
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .select(ORDER_SELECT)

  if (error) return { success: false, error: translateDbError(error.message) }

  // RLS turns "not allowed" (or "no such order") into zero updated rows
  // rather than an error, so an empty result must not be read as success.
  if (!data || data.length === 0) {
    return { success: false, error: translate("order.errors.notFoundOrDenied") }
  }
  return { success: true, order: toOrderRecord(data[0] as OrderRow) }
}
