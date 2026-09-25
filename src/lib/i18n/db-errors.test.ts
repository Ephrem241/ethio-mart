import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { translateDbError } from "@/lib/i18n/db-errors"
import { setActiveTranslator } from "@/lib/i18n/translate"
import { createTranslator } from "@/lib/i18n/translator"
import { am } from "@/locales/am"
import { en } from "@/locales/en"

// The database raises its own English exceptions (place_order, the status
// trigger). translateDbError maps each known one to a translated message and
// turns anything else into a generic one, so raw technical English never
// reaches the page. `translate` only works in the browser, so pretend to be one.
beforeEach(() => {
  vi.stubGlobal("window", {})
  setActiveTranslator(createTranslator("en", en))
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe("translateDbError", () => {
  it.each([
    ["You must be signed in to place an order.", en.errors.signInRequired],
    ["Your cart is empty.", en.checkout.errors.cartEmpty],
    ["Invalid quantity.", en.errors.invalidQuantity],
    ["Some items in your cart are no longer available. Please remove them and try again.", en.checkout.errors.unavailable],
    ["This payment method isn't available yet.", en.checkout.errors.paymentUnavailable],
    ["Delivery address is incomplete.", en.errors.addressIncomplete],
    ["Delivery is not available for this address.", en.errors.deliveryUnavailable],
    ["Order is already in this status.", en.errors.sameStatus],
    ["Enter a valid email address.", en.validation.email],
  ])("maps %j to its translated message", (raw, expected) => {
    expect(translateDbError(raw)).toBe(expected)
  })

  it("names the products that are short of stock", () => {
    const message = translateDbError("Not enough stock for: Leather Wallet, Minimalist Watch. Please update the quantity and try again.")
    expect(message).toBe(en.checkout.errors.insufficientStock.replace("{names}", "Leather Wallet, Minimalist Watch"))
  })

  it("names the status an order is stuck in, translated", () => {
    const message = translateDbError("Cannot change status of a delivered order.")
    expect(message).toBe(en.errors.statusTerminal.replace("{status}", en.order.status.delivered))
  })

  it("speaks Amharic when the page is in Amharic", () => {
    setActiveTranslator(createTranslator("am", am))
    expect(translateDbError("Your cart is empty.")).toBe(am.checkout.errors.cartEmpty)
  })

  it.each([
    "duplicate key value violates unique constraint \"orders_pkey\"",
    "permission denied for table orders",
    "",
  ])("hides the raw text of an unrecognised error (%j) behind a generic message", (raw) => {
    expect(translateDbError(raw)).toBe(en.common.somethingWentWrong)
  })

  it.each([
    "fetch failed",
    "TypeError: Failed to fetch", // Chrome
    "TypeError: NetworkError when attempting to fetch resource.", // Firefox
    "TypeError: Load failed", // Safari
    "Failed to load orders: TypeError: fetch failed", // how the service layer wraps it
  ])("says the shop could not be reached when the request never arrived (%j)", (raw) => {
    expect(translateDbError(raw)).toBe(en.errors.network)
  })

  it("says so in Amharic too", () => {
    setActiveTranslator(createTranslator("am", am))
    expect(translateDbError("TypeError: Failed to fetch")).toBe(am.errors.network)
  })

  it("copes with a missing message", () => {
    expect(translateDbError(undefined)).toBe(en.common.somethingWentWrong)
    expect(translateDbError(null)).toBe(en.common.somethingWentWrong)
  })
})
