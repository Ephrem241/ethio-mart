"use client"

import { useT } from "@/lib/i18n/provider"
import { cityLabel } from "@/lib/services/delivery"
import type { OrderDeliveryAddress } from "@/lib/types/orders"

function OrderDeliveryAddressSection({ address }: { address: OrderDeliveryAddress }) {
  const t = useT()

  return (
    <section className="space-y-2 rounded-card border border-border bg-card p-5 text-sm">
      <h2 className="font-medium text-charcoal">{t("order.address.title")}</h2>
      <p className="text-charcoal">
        {address.full_name}, {address.phone}
        <br />
        {address.address}, {address.woreda}, {address.sub_city}, {cityLabel(address.city, t)}
      </p>
      {address.notes && (
        <p className="text-muted-text">
          <span className="font-medium text-charcoal">{t("order.address.notes")} </span>
          {address.notes}
        </p>
      )}
    </section>
  )
}

export { OrderDeliveryAddressSection }
