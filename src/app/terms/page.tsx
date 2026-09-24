import type { Metadata } from "next"

import { BRAND_NAME } from "@/lib/brand"
import { getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { InfoPage, InfoSection, LEGAL_LAST_UPDATED } from "@/components/info/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/terms",
    title: t("info.terms.title"),
    description: t("info.terms.subtitle", { brand: BRAND_NAME }),
  })
}

// A plain-language draft matching how the store works (cash on delivery,
// fees shown at checkout). The owner should have it reviewed before launch.
export default async function TermsPage() {
  const t = await getT()
  const brand = { brand: BRAND_NAME }

  return (
    <InfoPage
      title={t("info.terms.title")}
      description={t("info.terms.subtitle", brand)}
      updated={LEGAL_LAST_UPDATED}
    >
      <InfoSection title={t("info.terms.useTitle")}>
        <p>{t("info.terms.useText", brand)}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.accountTitle")}>
        <p>{t("info.terms.accountText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.productsTitle")}>
        <p>{t("info.terms.productsText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.ordersTitle")}>
        <p>{t("info.terms.ordersText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.payTitle")} link={{ href: "/delivery", label: t("footer.delivery") }}>
        <p>{t("info.terms.payText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.returnsTitle")} link={{ href: "/returns", label: t("footer.returns") }}>
        <p>{t("info.terms.returnsText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.conductTitle")}>
        <p>{t("info.terms.conductText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.contentTitle")}>
        <p>{t("info.terms.contentText", brand)}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.liabilityTitle")}>
        <p>{t("info.terms.liabilityText")}</p>
      </InfoSection>

      <InfoSection title={t("info.terms.changesTitle")} link={{ href: "/contact", label: t("info.common.contactLink") }}>
        <p>{t("info.terms.changesText")}</p>
      </InfoSection>
    </InfoPage>
  )
}
