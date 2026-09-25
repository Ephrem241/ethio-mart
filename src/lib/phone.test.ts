import { describe, expect, it } from "vitest"

import { ETHIOPIA_PHONE_REGEX } from "@/lib/phone"

describe("Ethiopian phone numbers", () => {
  it.each(["0911223344", "0711223344", "+251911223344", "+251711223344", "0900000000"])("accepts %s", (number) => {
    expect(ETHIOPIA_PHONE_REGEX.test(number)).toBe(true)
  })

  it.each([
    ["too short", "091122334"],
    ["too long", "09112233445"],
    ["wrong first digit after the prefix", "0811223344"],
    ["landline-style prefix", "0111223344"],
    ["missing plus", "251911223344"],
    ["wrong country code", "+254911223344"],
    ["letters", "09112abc44"],
    ["spaces inside", "0911 223 344"],
    ["empty", ""],
    ["surrounding whitespace", " 0911223344 "],
  ])("rejects %s (%s)", (_why, number) => {
    expect(ETHIOPIA_PHONE_REGEX.test(number)).toBe(false)
  })
})
