import type { Dictionary } from "@/locales/en"

export const validation: Dictionary["validation"] = {
  required: "ይህ መስክ ያስፈልጋል።",
  invalid: "ይህ ዋጋ ትክክል አይደለም።",
  tooShort: "ቢያንስ {min} ቁምፊዎችን ያስገቡ።",
  tooLong: "ከ{max} ቁምፊዎች አይበልጥ።",
  tooSmall: "ዋጋው ቢያንስ {min} መሆን አለበት።",
  tooBig: "ዋጋው ከ{max} መብለጥ የለበትም።",
  email: "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",
  phone: "ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ።",
}
