import { describe, expect, it } from "vitest"

import { hasMalformedEncoding, isValidSlug } from "@/lib/slug"

describe("isValidSlug", () => {
  it.each(["leather-wallet", "classic-leather-bag", "a", "product-2", "e2e-mrqq4k1s-auoq", "42"])("accepts %j", (slug) => {
    expect(isValidSlug(slug)).toBe(true)
  })

  it.each([
    ["an empty slug", ""],
    ["upper case", "Leather-Wallet"],
    ["a space", "leather wallet"],
    ["an underscore", "leather_wallet"],
    ["a leading hyphen", "-wallet"],
    ["a trailing hyphen", "wallet-"],
    ["a double hyphen", "leather--wallet"],
    ["a null byte", "wallet\u0000"],
    ["a malformed percent sequence", "%E0%A4%A"],
    ["a SQL-looking payload", "' or 1=1--"],
    ["a path traversal", "../admin"],
    ["a slash", "a/b"],
    ["a non-latin name", "ቦርሳ"],
    ["something absurdly long", "a".repeat(201)],
  ])("rejects %s", (_what, slug) => {
    expect(isValidSlug(slug)).toBe(false)
  })

  it("accepts a slug right at the length limit", () => {
    expect(isValidSlug("a".repeat(200))).toBe(true)
  })
})

describe("hasMalformedEncoding", () => {
  it.each(["/", "/product/leather-wallet", "/product/%E1%89%A6%E1%88%AD%E1%88%8B", "/product/a%2Fb", "/search"])("lets %j through", (pathname) => {
    expect(hasMalformedEncoding(pathname)).toBe(false)
  })

  it.each(["/product/%FF", "/category/%E0%A4%A", "/product/%", "/orders/%C0%AF"])("catches %j", (pathname) => {
    expect(hasMalformedEncoding(pathname)).toBe(true)
  })
})
