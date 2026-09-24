import type { Metadata } from "next"

import { getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { getReturnWindowDays } from "@/lib/services/store-info"
import { InfoHelp, InfoLink, InfoPage, InfoSection } from "@/components/info/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/returns",
    title: t("info.returns.title"),
    description: t("info.returns.subtitle"),
  })
}

// A time limit is stated only when the shop has set one (store_settings
// `return_window_days`); otherwise the page promises no number.
export default async function ReturnsPage() {
  const [t, days] = await Promise.all([getT(), getReturnWindowDays()])

  return (
    <InfoPage title={t("info.returns.title")} description={t("info.returns.subtitle")}>
      <InfoSection title={t("info.returns.checkTitle")}>
        <p>{t("info.returns.checkText")}</p>
        <InfoLink href="/account/orders">{t("info.common.ordersLink")}</InfoLink>
      </InfoSection>

      <InfoSection title={t("info.returns.problemTitle")}>
        <p>{t("info.returns.problemText")}</p>
      </InfoSection>

      <InfoSection title={t("info.returns.windowTitle")}>
        <p>{days !== null ? t("info.returns.windowText", { days }) : t("info.returns.windowNone")}</p>
      </InfoSection>

      <InfoSection title={t("info.returns.howTitle")}>
        <p>{t("info.returns.howText")}</p>
        <InfoLink href="/contact">{t("info.common.contactLink")}</InfoLink>
      </InfoSection>

      <InfoSection title={t("info.returns.refundTitle")}>
        <p>{t("info.returns.refundText")}</p>
      </InfoSection>

      <InfoHelp title={t("info.common.questions")} text={t("info.faq.moreText")} />
    </InfoPage>
  )
}
