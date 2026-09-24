import type { Locale } from "@/lib/i18n/config"

// Catalog content (product and category names/descriptions) is stored in both
// languages in the database. These pick the right one, falling back to
// English when an Amharic value hasn't been entered — a partially translated
// catalog must still show something readable, never a blank.
export function pickLocale(locale: Locale, en: string, am?: string | null): string {
  return locale === "am" && am && am.trim() ? am : en
}

export function nameOf(item: { name_en: string; name_am?: string | null }, locale: Locale): string {
  return pickLocale(locale, item.name_en, item.name_am)
}

// A product's category name, in the visitor's language.
export function categoryNameOf(
  product: { categoryName: string; categoryNameAm?: string | null },
  locale: Locale
): string {
  return pickLocale(locale, product.categoryName, product.categoryNameAm)
}

export function descriptionOf(
  item: { description_en: string; description_am?: string | null },
  locale: Locale
): string {
  return pickLocale(locale, item.description_en, item.description_am)
}
