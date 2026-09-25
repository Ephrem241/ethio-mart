import { describe, expect, it } from "vitest"

import { categoryNameOf, descriptionOf, nameOf, pickLocale } from "@/lib/i18n/content"

// Catalog text is stored in both languages; a half-translated catalog must
// still show something readable.
describe("pickLocale", () => {
  it("gives English in English", () => {
    expect(pickLocale("en", "Wallet", "ቦርሳ")).toBe("Wallet")
  })

  it("gives Amharic in Amharic when there is an Amharic value", () => {
    expect(pickLocale("am", "Wallet", "የኪስ ቦርሳ")).toBe("የኪስ ቦርሳ")
  })

  it.each([undefined, null, "", "   "])("falls back to English in Amharic when the Amharic value is %j", (missing) => {
    expect(pickLocale("am", "Wallet", missing)).toBe("Wallet")
  })
})

describe("nameOf / descriptionOf / categoryNameOf", () => {
  it("pick the matching field in each language", () => {
    const item = { name_en: "Wallet", name_am: "ቦርሳ", description_en: "A wallet.", description_am: "ቦርሳ ነው።" }
    expect(nameOf(item, "en")).toBe("Wallet")
    expect(nameOf(item, "am")).toBe("ቦርሳ")
    expect(descriptionOf(item, "en")).toBe("A wallet.")
    expect(descriptionOf(item, "am")).toBe("ቦርሳ ነው።")
  })

  it("fall back to English when a translation was never entered", () => {
    expect(nameOf({ name_en: "Wallet", name_am: "" }, "am")).toBe("Wallet")
    expect(descriptionOf({ description_en: "A wallet.", description_am: null }, "am")).toBe("A wallet.")
    expect(categoryNameOf({ categoryName: "Fashion", categoryNameAm: undefined }, "am")).toBe("Fashion")
  })

  it("name a product's category in the visitor's language", () => {
    expect(categoryNameOf({ categoryName: "Fashion", categoryNameAm: "ፋሽን" }, "am")).toBe("ፋሽን")
    expect(categoryNameOf({ categoryName: "Fashion", categoryNameAm: "ፋሽን" }, "en")).toBe("Fashion")
  })
})
