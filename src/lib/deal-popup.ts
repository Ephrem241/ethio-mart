// When the homepage's deal popup may open by itself (deal-popup.tsx).
//
// It opens once per browsing session, a few seconds after the homepage loads,
// never straight away. sessionStorage remembers "already shown in this tab";
// a timestamp in localStorage adds a short cool-down across tabs, so opening
// the homepage in a second tab right after doesn't show it again. A new
// session after the cool-down may show it again: the promotion itself is never
// hidden for good (an ended one simply stops being sent by the server).
//
// Keys keep the `ethio-mart-` prefix like the rest of the site's storage.

export const DEAL_POPUP_SESSION_KEY = "ethio-mart-deal-popup-seen"
export const DEAL_POPUP_SHOWN_AT_KEY = "ethio-mart-deal-popup-shown-at"
/** How long the homepage waits before opening the popup. */
export const DEAL_POPUP_DELAY_MS = 6000
/** Minimum time between two automatic openings across tabs and sessions. */
export const DEAL_POPUP_COOLDOWN_MS = 30 * 60 * 1000

export interface DealPopupMemory {
  seenThisSession: boolean
  /** When it last opened by itself (ms since epoch), or null if never / unreadable. */
  lastShownAt: number | null
}

export function shouldAutoOpenDealPopup(memory: DealPopupMemory, now: number): boolean {
  if (memory.seenThisSession) return false
  if (memory.lastShownAt === null) return true
  // A timestamp in the future (clock changed) counts as "long ago".
  return now - memory.lastShownAt >= DEAL_POPUP_COOLDOWN_MS || memory.lastShownAt > now
}

// Storage can be missing or throw (private mode, blocked cookies): then the
// popup behaves as if nothing were remembered, and remembering fails quietly.
export function readDealPopupMemory(): DealPopupMemory {
  let seenThisSession = false
  let lastShownAt: number | null = null
  try {
    seenThisSession = window.sessionStorage.getItem(DEAL_POPUP_SESSION_KEY) === "1"
  } catch {}
  try {
    const stored = Number(window.localStorage.getItem(DEAL_POPUP_SHOWN_AT_KEY))
    lastShownAt = Number.isFinite(stored) && stored > 0 ? stored : null
  } catch {}
  return { seenThisSession, lastShownAt }
}

export function rememberDealPopupShown(now: number): void {
  try {
    window.sessionStorage.setItem(DEAL_POPUP_SESSION_KEY, "1")
  } catch {}
  try {
    window.localStorage.setItem(DEAL_POPUP_SHOWN_AT_KEY, String(now))
  } catch {}
}
