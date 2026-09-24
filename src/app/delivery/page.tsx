import type { Metadata } from "next"

import { formatPrice } from "@/lib/currency"
import { getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { cityLabel } from "@/lib/services/cities"
import { getDeliveryFees } from "@/lib/services/store-info"
import { getFreeDeliveryThreshold } from "@/lib/services/store-settings"
import { InfoHelp, InfoLink, InfoPage, InfoSection } from "@/components/info/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/delivery",
    title: t("info.delivery.title"),
    description: t("info.delivery.subtitle"),
  })
}

// Fees come from the same delivery_fees table place_order prices with, and the
// free-delivery line only appears when that rule is actually set — the page can
// never promise what checkout won't do.
export default async function DeliveryPage() {
  const [t, fees, freeFrom] = await Promise.all([getT(), getDeliveryFees(), getFreeDeliveryThreshold()])

  return (
    <InfoPage title={t("info.delivery.title")} description={t("info.delivery.subtitle")}>
      <InfoSection title={t("info.delivery.whereTitle")}>
        <p>{t("info.delivery.whereText")}</p>
      </InfoSection>

      <InfoSection title={t("info.delivery.feesTitle")}>
        {fees.length > 0 && (
          <div className="overflow-hidden rounded-card border border-border bg-white">
            <table className="w-full text-start">
              <caption className="sr-only">{t("info.delivery.feesCaption")}</caption>
              <thead className="bg-cream/70 text-sm text-muted-text">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium sm:px-5">
                    {t("info.delivery.city")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-medium sm:px-5">
                    {t("info.delivery.fee")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fees.map((row) => (
                  <tr key={row.city}>
                    <th scope="row" className="px-4 py-3 text-start font-normal text-charcoal sm:px-5">
                      {row.city === "Other" ? t("info.delivery.otherPlaces") : cityLabel(row.city, t)}
                    </th>
                    <td className="px-4 py-3 text-end font-medium whitespace-nowrap text-charcoal sm:px-5">
                      {formatPrice(row.fee, t)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {freeFrom !== null && (
          <p className="font-medium text-forest">{t("info.delivery.freeText", { amount: formatPrice(freeFrom, t) })}</p>
        )}
        <p className="text-sm text-muted-text">{t("info.delivery.feesNote")}</p>
      </InfoSection>

      <InfoSection title={t("info.delivery.payTitle")}>
        <p>{t("info.delivery.payText")}</p>
      </InfoSection>

      <InfoSection title={t("info.delivery.afterTitle")}>
        <p>{t("info.delivery.afterText")}</p>
        <InfoLink href="/account/orders">{t("info.common.ordersLink")}</InfoLink>
      </InfoSection>

      <InfoSection title={t("info.delivery.tipTitle")}>
        <p>{t("info.delivery.tipText")}</p>
      </InfoSection>

      <InfoHelp title={t("info.common.questions")} text={t("info.faq.moreText")} />
    </InfoPage>
  )
}
