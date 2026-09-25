import { describe, expect, it } from "vitest"

import { addressSchema } from "@/components/account/address-schema"
import { changePasswordSchema } from "@/components/account/change-password-schema"
import { profileSchema } from "@/components/account/profile-schema"
import { checkoutSchema } from "@/components/checkout/checkout-schema"

// The rules every form enforces before anything is sent. (The database enforces
// them again — these tests are about the shopper getting the right message at
// the right field, and about not letting junk through.)

const validDelivery = {
  fullName: "Abeba Kebede",
  phone: "0911223344",
  city: "Addis Ababa",
  subCity: "Bole",
  woreda: "03",
  address: "Behind the market, house 9",
}

const issuesOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => String(i.path[0]))

describe.each([
  ["address book", addressSchema, {}],
  ["checkout", checkoutSchema, { paymentMethod: "cod" }],
] as const)("%s delivery details", (_name, schema, extra) => {
  const valid = { ...validDelivery, ...extra }

  it("accepts a complete, valid set", () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })

  it("trims surrounding spaces from what it accepts", () => {
    const result = schema.safeParse({ ...valid, fullName: "  Abeba Kebede  ", address: "  Behind the market  " })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe("Abeba Kebede")
      expect(result.data.address).toBe("Behind the market")
    }
  })

  it("names each missing field", () => {
    const result = schema.safeParse({ fullName: "", phone: "", city: "", subCity: "", woreda: "", address: "", ...extra })
    expect(issuesOf(result).sort()).toEqual(["address", "city", "fullName", "phone", "subCity", "woreda"])
  })

  it.each([
    ["a one-letter name", { fullName: "A" }, "fullName"],
    ["a name of only spaces", { fullName: "   " }, "fullName"],
    ["a phone number with the wrong length", { phone: "091122" }, "phone"],
    ["a landline-style number", { phone: "0111223344" }, "phone"],
    ["a one-letter sub-city", { subCity: "B" }, "subCity"],
    ["an empty woreda", { woreda: " " }, "woreda"],
    ["a too-short street address", { address: "Bole" }, "address"],
    ["notes over 300 characters", { notes: "x".repeat(301) }, "notes"],
  ])("rejects %s", (_what, override, field) => {
    expect(issuesOf(schema.safeParse({ ...valid, ...override }))).toEqual([field])
  })

  it("accepts notes of exactly 300 characters, and no notes at all", () => {
    expect(schema.safeParse({ ...valid, notes: "x".repeat(300) }).success).toBe(true)
    expect(schema.safeParse({ ...valid, notes: undefined }).success).toBe(true)
  })

  it("accepts +251 phone numbers", () => {
    expect(schema.safeParse({ ...valid, phone: "+251911223344" }).success).toBe(true)
  })
})

describe("checkout payment method", () => {
  it("must be chosen", () => {
    expect(issuesOf(checkoutSchema.safeParse({ ...validDelivery, paymentMethod: "" }))).toEqual(["paymentMethod"])
    expect(issuesOf(checkoutSchema.safeParse(validDelivery))).toEqual(["paymentMethod"])
  })
})

describe("profile", () => {
  it("needs a name, but a phone number is optional", () => {
    expect(profileSchema.safeParse({ fullName: "Abeba Kebede", phone: "" }).success).toBe(true)
    expect(issuesOf(profileSchema.safeParse({ fullName: "A", phone: "" }))).toEqual(["fullName"])
  })

  it("checks a phone number that is given", () => {
    expect(profileSchema.safeParse({ fullName: "Abeba", phone: "0911223344" }).success).toBe(true)
    expect(profileSchema.safeParse({ fullName: "Abeba", phone: "12345" }).success).toBe(false)
  })
})

describe("change password", () => {
  it("needs the current password and a new one of at least 8 characters", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "12345678" }).success).toBe(true)
    expect(issuesOf(changePasswordSchema.safeParse({ currentPassword: "", newPassword: "12345678" }))).toEqual(["currentPassword"])
    expect(issuesOf(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "1234567" }))).toEqual(["newPassword"])
  })

  it("does not trim a password (spaces are allowed in one)", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "        " }).success).toBe(true)
  })
})
