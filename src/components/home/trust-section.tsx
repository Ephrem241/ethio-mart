import { ShieldCheck, Truck, BadgeCheck, Headset } from "lucide-react"

const items = [
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    description: "Your information is protected at every step.",
  },
  {
    icon: Truck,
    title: "Fast delivery",
    description: "Reliable delivery across Ethiopia.",
  },
  {
    icon: BadgeCheck,
    title: "Quality products",
    description: "Carefully selected items you can trust.",
  },
  {
    icon: Headset,
    title: "Customer support",
    description: "Here to help whenever you need us.",
  },
]

function TrustSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-center text-2xl font-semibold text-charcoal">Why shop with us?</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="space-y-2 rounded-card border border-border bg-card p-5 text-center"
          >
            <item.icon aria-hidden className="mx-auto size-6 text-burgundy" />
            <p className="font-medium text-charcoal">{item.title}</p>
            <p className="text-sm text-muted-text">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export { TrustSection }
