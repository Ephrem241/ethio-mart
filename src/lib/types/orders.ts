import type { PaymentStatus } from "@/lib/services/payment"

// Order types. Fields mirror the `orders` / `order_items` tables (spec
// Section 34/35) field-for-field, so the rows Postgres returns map onto
// these directly (see toOrderRecord in services/orders.ts).

export interface OrderDeliveryAddress {
  full_name: string
  phone: string
  city: string
  sub_city: string
  woreda: string
  address: string
  notes?: string
}

export interface OrderItemRecord {
  id: string
  order_id: string
  // NULL once the product is deleted (ON DELETE SET NULL): the line keeps
  // its own snapshot (name, price), so history survives product deletion.
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total: number
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled"
export type PaymentMethodId = "cod" | "manual"

export interface OrderStatusEvent {
  status: OrderStatus
  at: string
}

export interface OrderRecord {
  id: string
  user_id: string
  order_number: string
  status: OrderStatus
  payment_method: PaymentMethodId
  payment_status: PaymentStatus
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  delivery_address: OrderDeliveryAddress
  items: OrderItemRecord[]
  status_history: OrderStatusEvent[]
  created_at: string
  updated_at: string
}
