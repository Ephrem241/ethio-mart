import { RotateCcw, ShieldCheck, Truck } from "lucide-react"

import { BRAND_NAME } from "@/lib/brand"
import { formatPrice } from "@/lib/currency"
import { getT } from "@/lib/i18n/server"
import { getFreeDeliveryThreshold } from "@/lib/services/store-settings"
import { Container } from "@/components/layout/container"

// The thin dark bar above the header. The free-delivery line is shown ONLY
// when a free-delivery threshold is actually configured — it is read from the
// same `store_settings` row the database applies when it prices an order, so
// this bar can never promise something checkout doesn't do.
//
// Phones show a single line (the delivery offer, or the welcome line if there
// is no offer); from `lg` up it is the three-part layout.
async function AnnouncementBar() {
  const [t, threshold] = await Promise.all([getT(), getFreeDeliveryThreshold()])
  const freeDelivery =
    threshold != null ? t("nav.announcement.freeDelivery", { amount: formatPrice(threshold, t) }) : null
  const welcome = t("nav.announcement.welcome", { brand: BRAND_NAME })

  return (
    // A named region, so its text is inside a landmark like the rest of the page.
    <section aria-label={t("nav.announcementsLabel")} className="bg-forest-dark text-[13px] leading-none text-white/90">
      <Container className="flex h-9 items-center justify-center lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <p className="flex items-center gap-2 truncate lg:hidden">
          {freeDelivery && <Truck aria-hidden className="size-3.5 shrink-0 text-gold" />}
          <span className="truncate">{freeDelivery ?? welcome}</span>
        </p>

        <p className="hidden items-center gap-2 lg:flex">
          {freeDelivery && (
            <>
              <Truck aria-hidden className="size-3.5 shrink-0 text-gold" />
              {freeDelivery}
            </>
          )}
        </p>
        <p className="hidden text-center lg:block">{welcome}</p>
        <p className="hidden items-center justify-end gap-4 lg:flex">
          <span className="flex items-center gap-1.5">
            <RotateCcw aria-hidden className="size-3.5 text-gold" />
            {t("nav.announcement.easyReturns")}
          </span>
          <span aria-hidden className="h-3 w-px bg-white/25" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden className="size-3.5 text-gold" />
            {t("nav.announcement.securePayments")}
          </span>
        </p>
      </Container>
    </section>
  )
}

export { AnnouncementBar }
