import type { Translator } from "@/lib/i18n/translator"

// Digits and separators stay the same in both languages (Ethiopian retail
// uses Western digits); only the currency word changes: ETB / ብር.
export function formatPrice(amount: number, t: Translator): string {
  return t("common.money", { amount: formatNumber(amount) })
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)
}
