import { z } from "zod"

import { translate } from "@/lib/i18n/translate"

// Zod words every issue it finds in English unless told otherwise. Schemas
// give their own fields specific, translated messages (`{ error: () => ... }`);
// this catches the rest — a number field holding NaN, a too-short string with
// no custom text — so no English default ever reaches an Amharic visitor.
// (A message set on the schema itself always wins over this.)
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        return issue.input === undefined || issue.input === null || issue.input === ""
          ? translate("validation.required")
          : translate("validation.invalid")
      case "too_small":
        return issue.origin === "string"
          ? translate("validation.tooShort", { min: String(issue.minimum) })
          : translate("validation.tooSmall", { min: String(issue.minimum) })
      case "too_big":
        return issue.origin === "string"
          ? translate("validation.tooLong", { max: String(issue.maximum) })
          : translate("validation.tooBig", { max: String(issue.maximum) })
      case "invalid_format":
        return issue.format === "email" ? translate("validation.email") : translate("validation.invalid")
      default:
        return translate("validation.invalid")
    }
  },
})
