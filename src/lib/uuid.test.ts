import { describe, expect, it } from "vitest"

import { UUID_RE } from "@/lib/uuid"

describe("UUID_RE", () => {
  it("accepts real UUIDs in either case", () => {
    expect(UUID_RE.test("20b7514a-d4ea-42bb-a3bb-d899369af8ae")).toBe(true)
    expect(UUID_RE.test("20B7514A-D4EA-42BB-A3BB-D899369AF8AE")).toBe(true)
  })

  it.each([
    "classic-leather-bag", // the old mock slug ids that once lived in saved carts
    "",
    "20b7514a-d4ea-42bb-a3bb-d899369af8a", // one character short
    "20b7514a-d4ea-42bb-a3bb-d899369af8ae0", // one too many
    "20b7514ad4ea42bba3bbd899369af8ae", // no dashes
    "zzzzzzzz-d4ea-42bb-a3bb-d899369af8ae", // not hex
    " 20b7514a-d4ea-42bb-a3bb-d899369af8ae",
  ])("rejects %j", (value) => {
    expect(UUID_RE.test(value)).toBe(false)
  })
})
