import type { MessageKey, Translator } from "@/lib/i18n/translator"

// The cities the shop delivers to, as the checkout, the address book and the
// delivery-information page show them. Pure (no data access), so a Server
// Component can import it without pulling in the browser database client that
// services/delivery.ts uses for fee lookups.
//
// The English name is the stored/canonical value (orders, addresses and the
// delivery_fees table all use it); the label shown to people is translated. A
// city here without a matching fee row simply falls back to the 'Other' fee,
// same as the database does.
const CITY_KEYS: Record<string, MessageKey> = {
  "Addis Ababa": "cities.addisAbaba",
  Adama: "cities.adama",
  "Bahir Dar": "cities.bahirDar",
  Hawassa: "cities.hawassa",
  "Dire Dawa": "cities.direDawa",
  Mekelle: "cities.mekelle",
  Gondar: "cities.gondar",
  Jimma: "cities.jimma",
  Other: "cities.other",
}

export const DELIVERY_CITIES = Object.keys(CITY_KEYS)

// A city outside the list (an old order, a hand-edited address) is shown as stored.
export function cityLabel(city: string, t: Translator): string {
  const key = CITY_KEYS[city]
  return key ? t(key) : city
}

export function deliveryCityOptions(t: Translator): { value: string; label: string }[] {
  return DELIVERY_CITIES.map((value) => ({ value, label: cityLabel(value, t) }))
}
