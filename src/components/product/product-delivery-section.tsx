// No specific fee or day-count is stated here on purpose — spec Section 56
// requires delivery pricing to be configurable, not hardcoded, and that
// system doesn't exist until checkout (Phase 8).
function ProductDeliverySection() {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium text-charcoal">Delivery</h2>
      <p className="text-sm text-muted-text">
        Delivery fees are calculated at checkout based on your delivery address.
      </p>
      <p className="text-sm text-muted-text">
        Most orders are prepared and dispatched within a few business days.
      </p>
    </section>
  )
}

export { ProductDeliverySection }
