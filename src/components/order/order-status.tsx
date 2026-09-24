"use client"

import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import type { OrderStatus as Status } from "@/lib/types/orders"
import { getOrderStatusMeta } from "@/lib/order-status"
import { Badge } from "@/components/ui/badge"

function OrderStatus({ status, className }: { status: Status; className?: string }) {
  const t = useT()
  const meta = getOrderStatusMeta(status, t)

  return (
    <Badge variant="outline" className={cn("border-transparent", meta.className, className)}>
      {meta.label}
    </Badge>
  )
}

export { OrderStatus }
