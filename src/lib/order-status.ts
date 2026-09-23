import type { OrderStatus } from "@/lib/types/orders"

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

// pending -> the one state something still needs to happen to (warning);
// delivered/cancelled -> the two terminal outcomes (success/error);
// confirmed/preparing/shipped -> in progress normally, nothing needs
// attention right now (neutral secondary tone).
export function getOrderStatusMeta(status: OrderStatus): { label: string; className: string } {
  const label = ORDER_STATUS_LABELS[status]
  switch (status) {
    case "pending":
      return { label, className: "bg-warning/10 text-warning" }
    case "delivered":
      return { label, className: "bg-success/10 text-success" }
    case "cancelled":
      return { label, className: "bg-error/10 text-error" }
    default:
      return { label, className: "bg-secondary text-secondary-foreground" }
  }
}

export type OrderHistoryFilter = "all" | "pending" | "delivered" | "cancelled"

export const ORDER_HISTORY_FILTERS: { id: OrderHistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
]

// The spec gives 4 filter buckets for 6 real statuses. "Pending" here means
// "not yet resolved" (pending/confirmed/preparing/shipped), matching the
// same three-way grouping the badge color mapping above already reflects.
const IN_PROGRESS_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped"]

export function matchesOrderHistoryFilter(status: OrderStatus, filter: OrderHistoryFilter): boolean {
  switch (filter) {
    case "all":
      return true
    case "pending":
      return IN_PROGRESS_STATUSES.includes(status)
    case "delivered":
      return status === "delivered"
    case "cancelled":
      return status === "cancelled"
  }
}
