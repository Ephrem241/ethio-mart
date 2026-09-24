import { Truck } from "lucide-react"

import { formatPrice } from "@/lib/currency"
import { getT } from "@/lib/i18n/server"
import { getFreeDeliveryThreshold } from "@/lib/services/store-settings"

// No specific fee or day-count is stated here on purpose — spec Section 56
// requires delivery pricing to be configurable, not hardcoded. The one concrete
// promise it makes — free delivery above an amount — is shown only when that
// amount is actually configured (the same setting checkout applies).
async function ProductDeliverySection() {
  const [t, threshold] = await Promise.all([getT(), getFreeDeliveryThreshold()])

  return (
    <section className="space-y-4 rounded-card border border-border/70 bg-card p-5 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-charcoal">
        <Truck aria-hidden className="size-5 text-forest" strokeWidth={1.75} />
        {t("product.delivery.title")}
      </h2>
      <ul className="space-y-2.5 text-sm leading-relaxed text-muted-text">
        {threshold != null && (
          <li className="font-medium text-forest">
            {t("cart.summary.freeDeliveryOffer", { amount: formatPrice(threshold, t) })}
          </li>
        )}
        <li>{t("product.delivery.fees")}</li>
        <li>{t("product.delivery.dispatch")}</li>
      </ul>
    </section>
  )
}

export { ProductDeliverySection }
