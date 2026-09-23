import type { OrderDeliveryAddress } from "@/lib/types/orders"

function OrderDeliveryAddressSection({ address }: { address: OrderDeliveryAddress }) {
  return (
    <section className="space-y-2 rounded-card border border-border bg-card p-5 text-sm">
      <h2 className="font-medium text-charcoal">Delivery address</h2>
      <p className="text-charcoal">
        {address.full_name}, {address.phone}
        <br />
        {address.address}, {address.woreda}, {address.sub_city}, {address.city}
      </p>
      {address.notes && (
        <p className="text-muted-text">
          <span className="font-medium text-charcoal">Notes: </span>
          {address.notes}
        </p>
      )}
    </section>
  )
}

export { OrderDeliveryAddressSection }
