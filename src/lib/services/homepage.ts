import { pickLocale } from "@/lib/i18n/content"
import type { Locale } from "@/lib/i18n/config"

// Homepage content (spec Section 33): one hero + one promo banner, stored as
// two keyed rows in `homepage_sections` (a deliberate match for Phase 11's
// "exactly one hero, one promo slot" design — not a general CMS). Text and
// links only; no image field, since banner image upload was explicitly not
// built (no UI consumes the `banners` bucket yet).
//
// Every visible text exists in English (`headline`) and Amharic
// (`headline_am`) inside the row's JSON; links are shared. A missing Amharic
// value falls back to the English one, field by field.

export interface HomepageSettings {
  heroHeadline: string
  heroHeadlineAm: string
  heroSubtext: string
  heroSubtextAm: string
  heroCtaLabel: string
  heroCtaLabelAm: string
  heroCtaHref: string
  heroSecondaryCtaLabel: string
  heroSecondaryCtaLabelAm: string
  heroSecondaryCtaHref: string
  promoEyebrow: string
  promoEyebrowAm: string
  promoHeadline: string
  promoHeadlineAm: string
  promoSubtext: string
  promoSubtextAm: string
  promoCtaLabel: string
  promoCtaLabelAm: string
  promoCtaHref: string
  /**
   * When the special deal ends, as an ISO date-time ("" = no end date). While
   * it is in the future the homepage counts down to it; otherwise the banner
   * counts down to the end of the day in Addis Ababa ("Today's Special Deals").
   */
  promoEndsAt: string
}

// Only used if the rows are missing entirely (never on a properly migrated
// project — 0005 seeds both), so the storefront can't render blank.
//
// A newline in the headline is a deliberate line break (the hero shows it).
// `{maxDiscount}` in the promo texts is replaced with the biggest discount
// among the products actually on sale (see fillDealTokens), so the banner can
// never promise a bigger discount than exists.
export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroHeadline: "Everything You Love,\nAll in One Place.",
  heroHeadlineAm: "የሚወዱትን ሁሉ፣\nበአንድ ቦታ።",
  heroSubtext: "Discover quality products for your home, kitchen, family, and everyday life.",
  heroSubtextAm: "ለቤትዎ፣ ለወጥ ቤትዎ፣ ለቤተሰብዎ እና ለዕለት ተዕለት ኑሮዎ ጥራት ያላቸው ምርቶችን ያግኙ።",
  heroCtaLabel: "Shop Now",
  heroCtaLabelAm: "አሁን ይግዙ",
  heroCtaHref: "/shop",
  heroSecondaryCtaLabel: "Explore Categories",
  heroSecondaryCtaLabelAm: "ምድቦችን ያስሱ",
  heroSecondaryCtaHref: "/categories",
  promoEyebrow: "Today's Special Deals",
  promoEyebrowAm: "የዛሬ ልዩ ቅናሾች",
  promoHeadline: "Up to {maxDiscount}% Off",
  promoHeadlineAm: "እስከ {maxDiscount}% ቅናሽ",
  promoSubtext: "On selected home, kitchen, and lifestyle products.",
  promoSubtextAm: "በተመረጡ የቤት፣ የወጥ ቤት እና የአኗኗር ዘይቤ ምርቶች ላይ።",
  promoCtaLabel: "Shop Deals",
  promoCtaLabelAm: "ቅናሾችን ይግዙ",
  promoCtaHref: "/deals",
  promoEndsAt: "",
}

export interface HomepageSectionRow {
  section_key: "hero" | "promo"
  content: Record<string, string | undefined>
}

export function settingsFromSections(rows: HomepageSectionRow[]): HomepageSettings {
  const hero = rows.find((r) => r.section_key === "hero")?.content ?? {}
  const promo = rows.find((r) => r.section_key === "promo")?.content ?? {}
  const d = DEFAULT_HOMEPAGE_SETTINGS

  return {
    heroHeadline: hero.headline ?? d.heroHeadline,
    heroHeadlineAm: hero.headline_am ?? "",
    heroSubtext: hero.subtext ?? d.heroSubtext,
    heroSubtextAm: hero.subtext_am ?? "",
    heroCtaLabel: hero.cta_label ?? d.heroCtaLabel,
    heroCtaLabelAm: hero.cta_label_am ?? "",
    heroCtaHref: hero.cta_href ?? d.heroCtaHref,
    heroSecondaryCtaLabel: hero.secondary_cta_label ?? d.heroSecondaryCtaLabel,
    heroSecondaryCtaLabelAm: hero.secondary_cta_label_am ?? "",
    heroSecondaryCtaHref: hero.secondary_cta_href ?? d.heroSecondaryCtaHref,
    promoEyebrow: promo.eyebrow ?? d.promoEyebrow,
    promoEyebrowAm: promo.eyebrow_am ?? "",
    promoHeadline: promo.headline ?? d.promoHeadline,
    promoHeadlineAm: promo.headline_am ?? "",
    promoSubtext: promo.subtext ?? d.promoSubtext,
    promoSubtextAm: promo.subtext_am ?? "",
    promoCtaLabel: promo.cta_label ?? d.promoCtaLabel,
    promoCtaLabelAm: promo.cta_label_am ?? "",
    promoCtaHref: promo.cta_href ?? d.promoCtaHref,
    promoEndsAt: promo.ends_at ?? "",
  }
}

// An empty Amharic field is stored as "no key" rather than "": absence is the
// one representation of "not translated" (the storefront treats both the same,
// but a stray empty string would also block a later data migration from
// filling the value in).
function withoutEmpty(content: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(content).filter(([key, value]) => !((key.endsWith("_am") || key === "ends_at") && value === ""))
  )
}

export function sectionsFromSettings(s: HomepageSettings): HomepageSectionRow[] {
  return [
    {
      section_key: "hero",
      content: withoutEmpty({
        headline: s.heroHeadline,
        headline_am: s.heroHeadlineAm,
        subtext: s.heroSubtext,
        subtext_am: s.heroSubtextAm,
        cta_label: s.heroCtaLabel,
        cta_label_am: s.heroCtaLabelAm,
        cta_href: s.heroCtaHref,
        secondary_cta_label: s.heroSecondaryCtaLabel,
        secondary_cta_label_am: s.heroSecondaryCtaLabelAm,
        secondary_cta_href: s.heroSecondaryCtaHref,
      }),
    },
    {
      section_key: "promo",
      content: withoutEmpty({
        eyebrow: s.promoEyebrow,
        eyebrow_am: s.promoEyebrowAm,
        headline: s.promoHeadline,
        headline_am: s.promoHeadlineAm,
        subtext: s.promoSubtext,
        subtext_am: s.promoSubtextAm,
        cta_label: s.promoCtaLabel,
        cta_label_am: s.promoCtaLabelAm,
        cta_href: s.promoCtaHref,
        ends_at: s.promoEndsAt,
      }),
    },
  ]
}

// Milliseconds from now until the promo's end date; 0 when there is no (valid)
// end date or it has passed. Read on the server for each request — the page is
// rendered per visitor, so "now" is genuinely the time of the request — and
// kept in a plain function rather than in the component so the render itself
// stays free of clock reads.
export function remainingUntil(endsAtIso: string): number {
  const end = endsAtIso ? Date.parse(endsAtIso) : NaN
  return Number.isNaN(end) ? 0 : Math.max(0, end - Date.now())
}

// Ethiopia is UTC+3 all year (no daylight saving), so "midnight in Addis
// Ababa" is a fixed offset from UTC.
const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** The next midnight in Addis Ababa, as an ISO date-time: when "today's" deals end. */
export function endOfDayInAddis(now: number = Date.now()): string {
  const addisNow = now + ADDIS_OFFSET_MS
  const nextAddisMidnight = (Math.floor(addisNow / DAY_MS) + 1) * DAY_MS
  return new Date(nextAddisMidnight - ADDIS_OFFSET_MS).toISOString()
}

// Replaces `{maxDiscount}` in the promo headline and subtext with the real
// figure (a whole percent) — see DEFAULT_HOMEPAGE_SETTINGS.
export function fillDealTokens(s: HomepageSettings, maxDiscountPercent: number): HomepageSettings {
  const fill = (text: string) => text.replaceAll("{maxDiscount}", String(maxDiscountPercent))
  return { ...s, promoHeadline: fill(s.promoHeadline), promoSubtext: fill(s.promoSubtext) }
}

// The copy the storefront should show right now: the English fields hold the
// text for the visitor's language, so Hero and PromoBanner stay language-blind.
export function localizeHomepage(s: HomepageSettings, locale: Locale): HomepageSettings {
  return {
    ...s,
    heroHeadline: pickLocale(locale, s.heroHeadline, s.heroHeadlineAm),
    heroSubtext: pickLocale(locale, s.heroSubtext, s.heroSubtextAm),
    heroCtaLabel: pickLocale(locale, s.heroCtaLabel, s.heroCtaLabelAm),
    heroSecondaryCtaLabel: pickLocale(locale, s.heroSecondaryCtaLabel, s.heroSecondaryCtaLabelAm),
    promoEyebrow: pickLocale(locale, s.promoEyebrow, s.promoEyebrowAm),
    promoHeadline: pickLocale(locale, s.promoHeadline, s.promoHeadlineAm),
    promoSubtext: pickLocale(locale, s.promoSubtext, s.promoSubtextAm),
    promoCtaLabel: pickLocale(locale, s.promoCtaLabel, s.promoCtaLabelAm),
  }
}
