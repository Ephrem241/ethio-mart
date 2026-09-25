import { describe, expect, it } from "vitest"

import { getSafeRedirect } from "@/lib/safe-redirect"

// `?redirect=` comes from the address bar, so anyone can put anything in it.
describe("getSafeRedirect", () => {
  const fallback = "/account"

  it("keeps a same-site path, with its query string", () => {
    expect(getSafeRedirect("/account/orders", fallback)).toBe("/account/orders")
    expect(getSafeRedirect("/shop?sort=newest&page=2", fallback)).toBe("/shop?sort=newest&page=2")
    expect(getSafeRedirect("/product/leather-wallet#reviews", fallback)).toBe("/product/leather-wallet#reviews")
  })

  it("uses the first value when the parameter is repeated", () => {
    expect(getSafeRedirect(["/cart", "/checkout"], fallback)).toBe("/cart")
  })

  it("falls back when there is nothing usable", () => {
    expect(getSafeRedirect(undefined, fallback)).toBe(fallback)
    expect(getSafeRedirect("", fallback)).toBe(fallback)
    expect(getSafeRedirect([], fallback)).toBe(fallback)
  })

  it.each([
    ["an absolute URL", "https://evil.example/steal"],
    ["a protocol-relative URL", "//evil.example"],
    ["a scheme in the middle", "/redirect?to=https://evil.example"],
    ["a path without a leading slash", "account"],
    ["a javascript: URL", "javascript:alert(1)"],
    // Browsers read a backslash as a slash, and ignore tabs and line breaks
    // inside a URL, so each of these would land on evil.example.
    ["a backslash after the slash", "/\\evil.example"],
    ["a tab between the slashes", "/\t/evil.example"],
    ["a line break between the slashes", "/\n/evil.example"],
    ["a carriage return between the slashes", "/\r/evil.example"],
    ["a backslash further along", "/shop\\..\\..\\evil"],
    ["a control character", "/shop\u0000"],
  ])("refuses %s", (_what, value) => {
    expect(getSafeRedirect(value, fallback)).toBe(fallback)
  })
})
