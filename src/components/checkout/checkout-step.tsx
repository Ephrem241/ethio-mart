import type { ReactNode } from "react"

// One numbered card of the checkout: 1 Delivery, 2 Payment, 3 Review. The number
// is decoration — the heading carries the meaning — so it is hidden from
// assistive technology.
function CheckoutStep({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: ReactNode
}) {
  const headingId = `checkout-step-${number}`

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-5 rounded-card border border-border/70 bg-card p-5 shadow-soft sm:p-6"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
        >
          {number}
        </span>
        <h2 id={headingId} className="font-display text-lg font-semibold text-charcoal">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export { CheckoutStep }
