// Homepage content (spec Section 33): one hero + one promo banner, stored as
// two keyed rows in `homepage_sections` (a deliberate match for Phase 11's
// "exactly one hero, one promo slot" design — not a general CMS). Text and
// links only; no image field, since banner image upload was explicitly not
// built (no UI consumes the `banners` bucket yet).

export interface HomepageSettings {
  heroHeadline: string
  heroSubtext: string
  heroCtaLabel: string
  heroCtaHref: string
  heroSecondaryCtaLabel: string
  heroSecondaryCtaHref: string
  promoEyebrow: string
  promoHeadline: string
  promoSubtext: string
  promoCtaLabel: string
  promoCtaHref: string
}

// Only used if the rows are missing entirely (never on a properly migrated
// project — 0005 seeds both), so the storefront can't render blank.
export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroHeadline: "Find something you'll love.",
  heroSubtext: "Discover everyday products, special offers, and carefully selected essentials.",
  heroCtaLabel: "Shop Now",
  heroCtaHref: "/shop",
  heroSecondaryCtaLabel: "Explore Categories",
  heroSecondaryCtaHref: "/categories",
  promoEyebrow: "Flash sale",
  promoHeadline: "Save on selected items, for a limited time",
  promoSubtext: "Discounts across fashion, electronics, kitchen, and more.",
  promoCtaLabel: "Shop the deals",
  promoCtaHref: "#flash-deals",
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
    heroSubtext: hero.subtext ?? d.heroSubtext,
    heroCtaLabel: hero.cta_label ?? d.heroCtaLabel,
    heroCtaHref: hero.cta_href ?? d.heroCtaHref,
    heroSecondaryCtaLabel: hero.secondary_cta_label ?? d.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: hero.secondary_cta_href ?? d.heroSecondaryCtaHref,
    promoEyebrow: promo.eyebrow ?? d.promoEyebrow,
    promoHeadline: promo.headline ?? d.promoHeadline,
    promoSubtext: promo.subtext ?? d.promoSubtext,
    promoCtaLabel: promo.cta_label ?? d.promoCtaLabel,
    promoCtaHref: promo.cta_href ?? d.promoCtaHref,
  }
}

export function sectionsFromSettings(s: HomepageSettings): HomepageSectionRow[] {
  return [
    {
      section_key: "hero",
      content: {
        headline: s.heroHeadline,
        subtext: s.heroSubtext,
        cta_label: s.heroCtaLabel,
        cta_href: s.heroCtaHref,
        secondary_cta_label: s.heroSecondaryCtaLabel,
        secondary_cta_href: s.heroSecondaryCtaHref,
      },
    },
    {
      section_key: "promo",
      content: {
        eyebrow: s.promoEyebrow,
        headline: s.promoHeadline,
        subtext: s.promoSubtext,
        cta_label: s.promoCtaLabel,
        cta_href: s.promoCtaHref,
      },
    },
  ]
}
