import type { Metadata } from "next"

import { BRAND_NAME } from "@/lib/brand"
import { getT } from "@/lib/i18n/server"
import { pageMetadata } from "@/lib/seo/metadata"
import { InfoList, InfoPage, InfoSection, LEGAL_LAST_UPDATED } from "@/components/info/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/privacy",
    title: t("info.privacy.title"),
    description: t("info.privacy.subtitle"),
  })
}

// Describes what the app actually does with data: Supabase account + order
// records, the language cookie, cart/favorites/recent searches in browser
// storage, the newsletter list. A plain-language draft — the owner should have
// it reviewed before launch.
export default async function PrivacyPage() {
  const t = await getT()

  return (
    <InfoPage title={t("info.privacy.title")} description={t("info.privacy.subtitle")} updated={LEGAL_LAST_UPDATED}>
      <InfoSection title={t("info.privacy.whoTitle")} link={{ href: "/contact", label: t("info.common.contactLink") }}>
        <p>{t("info.privacy.whoText", { brand: BRAND_NAME })}</p>
      </InfoSection>

      <InfoSection title={t("info.privacy.collectTitle")}>
        <p>{t("info.privacy.collectIntro")}</p>
        <InfoList>
          <li>{t("info.privacy.collect1")}</li>
          <li>{t("info.privacy.collect2")}</li>
          <li>{t("info.privacy.collect3")}</li>
          <li>{t("info.privacy.collect4")}</li>
          <li>{t("info.privacy.collect5")}</li>
        </InfoList>
      </InfoSection>

      <InfoSection title={t("info.privacy.useTitle")}>
        <p>{t("info.privacy.useText")}</p>
      </InfoSection>

      <InfoSection title={t("info.privacy.storageTitle")}>
        <p>{t("info.privacy.storageText")}</p>
      </InfoSection>

      <InfoSection title={t("info.privacy.shareTitle")}>
        <p>{t("info.privacy.shareText")}</p>
      </InfoSection>

      <InfoSection title={t("info.privacy.keepTitle")}>
        <p>{t("info.privacy.keepText")}</p>
      </InfoSection>

      <InfoSection
        title={t("info.privacy.choicesTitle")}
        link={{ href: "/account/settings", label: t("account.nav.settings") }}
      >
        <p>{t("info.privacy.choicesText")}</p>
      </InfoSection>

      <InfoSection title={t("info.privacy.changesTitle")}>
        <p>{t("info.privacy.changesText")}</p>
      </InfoSection>
    </InfoPage>
  )
}
