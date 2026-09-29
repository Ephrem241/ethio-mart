import type { Translator } from "@/lib/i18n/translator"
import type { OrderStatus } from "@/lib/types/orders"

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
]

// pending -> the one state something still needs to happen to (warning);
// delivered/cancelled -> the two terminal outcomes (success/error);
// confirmed/preparing/shipped -> in progress normally, nothing needs
// attention right now (neutral secondary tone).
export function getOrderStatusMeta(
  status: OrderStatus,
  t: Translator
): { label: string; className: string } {
  const label = t(`order.status.${status}`)
  switch (status) {
    case "pending":
      return { label, className: "bg-warning/10 text-warning-text" }
    case "delivered":
      return { label, className: "bg-success/10 text-success" }
    case "cancelled":
      return { label, className: "bg-error/10 text-error" }
    default:
      return { label, className: "bg-secondary text-secondary-foreground" }
  }
}

// Where an order may go next — the same rule the database enforces (migration
// 0018): forward along the lifecycle (skipping a stage is allowed), or to
// cancelled from any open status; delivered and cancelled are final.
export function allowedNextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "delivered" || status === "cancelled") return []
  const at = ORDER_STATUSES.indexOf(status)
  return ORDER_STATUSES.filter((next, i) => next === "cancelled" || i > at)
}

// What an admin's status menu lists: the current status, then its next steps.
export function statusMenuOptions(status: OrderStatus): OrderStatus[] {
  return [status, ...allowedNextStatuses(status)]
}

export type OrderHistoryFilter = "all" | "pending" | "delivered" | "cancelled"

export const ORDER_HISTORY_FILTERS: OrderHistoryFilter[] = ["all", "pending", "delivered", "cancelled"]

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
