import { Clock, CheckCircle2, PackageSearch, Truck, PackageCheck, XCircle, type LucideIcon } from "lucide-react"

import type { OrderStatusEvent } from "@/lib/types/orders"
import { ORDER_STATUS_LABELS } from "@/lib/order-status"
import { formatOrderDateTime } from "@/lib/date"

const STATUS_ICONS: Record<OrderStatusEvent["status"], LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: PackageSearch,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
}

// A real event log, not a synthetic 6-step progress bar — if an order is
// cancelled straight from "pending" this renders exactly two entries, not
// five grayed-out phantom steps that never happened.
function OrderTimeline({ history }: { history: OrderStatusEvent[] }) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">Timeline</h2>
      <ol className="space-y-4">
        {history.map((event, index) => {
          const Icon = STATUS_ICONS[event.status]
          const isLatest = index === history.length - 1
          return (
            <li key={`${event.status}-${event.at}`} className="flex gap-3">
              <Icon
                aria-hidden
                className={isLatest ? "size-5 shrink-0 text-burgundy" : "size-5 shrink-0 text-muted-text"}
              />
              <div>
                <p className={isLatest ? "text-sm font-medium text-charcoal" : "text-sm text-charcoal"}>
                  {ORDER_STATUS_LABELS[event.status]}
                </p>
                <p className="text-xs text-muted-text">{formatOrderDateTime(event.at)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export { OrderTimeline }
