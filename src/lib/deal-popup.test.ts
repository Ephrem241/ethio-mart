import { describe, expect, it } from "vitest"

import { DEAL_POPUP_COOLDOWN_MS, shouldAutoOpenDealPopup } from "@/lib/deal-popup"

const NOW = Date.parse("2026-09-30T12:00:00Z")

describe("shouldAutoOpenDealPopup", () => {
  it("opens on a first visit", () => {
    expect(shouldAutoOpenDealPopup({ seenThisSession: false, lastShownAt: null }, NOW)).toBe(true)
  })

  it("never opens twice in one session, however long ago", () => {
    expect(shouldAutoOpenDealPopup({ seenThisSession: true, lastShownAt: null }, NOW)).toBe(false)
    expect(shouldAutoOpenDealPopup({ seenThisSession: true, lastShownAt: NOW - 10 * DEAL_POPUP_COOLDOWN_MS }, NOW)).toBe(false)
  })

  it("waits out the cool-down in a new tab or session", () => {
    expect(shouldAutoOpenDealPopup({ seenThisSession: false, lastShownAt: NOW - 60_000 }, NOW)).toBe(false)
    expect(shouldAutoOpenDealPopup({ seenThisSession: false, lastShownAt: NOW - DEAL_POPUP_COOLDOWN_MS + 1 }, NOW)).toBe(false)
  })

  it("opens again in a new session once the cool-down has passed", () => {
    expect(shouldAutoOpenDealPopup({ seenThisSession: false, lastShownAt: NOW - DEAL_POPUP_COOLDOWN_MS }, NOW)).toBe(true)
  })

  it("treats a timestamp from the future (clock changed) as long ago", () => {
    expect(shouldAutoOpenDealPopup({ seenThisSession: false, lastShownAt: NOW + 60_000 }, NOW)).toBe(true)
  })
})
