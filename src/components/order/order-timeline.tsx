"use client"

import { Clock, CheckCircle2, PackageSearch, Truck, PackageCheck, XCircle, type LucideIcon } from "lucide-react"

import type { OrderStatusEvent } from "@/lib/types/orders"
import { useT } from "@/lib/i18n/provider"
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
  const t = useT()
  return (
    <section className="space-y-4 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">{t("order.timeline.title")}</h2>
      <ol className="space-y-4">
        {history.map((event, index) => {
          const Icon = STATUS_ICONS[event.status]
          const isLatest = index === history.length - 1
          return (
            <li key={`${event.status}-${event.at}`} aria-current={isLatest ? "step" : undefined} className="flex gap-3">
              <Icon
                aria-hidden
                className={isLatest ? "size-5 shrink-0 text-forest" : "size-5 shrink-0 text-muted-text"}
              />
              <div>
                <p className={isLatest ? "text-sm font-medium text-charcoal" : "text-sm text-charcoal"}>
                  {t(`order.status.${event.status}`)}
                </p>
                <p className="text-xs text-muted-text">{formatOrderDateTime(event.at, t.locale)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export { OrderTimeline }
