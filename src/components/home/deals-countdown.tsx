"use client"

import { useEffect, useState } from "react"

import { useT } from "@/lib/i18n/provider"
import { endOfDayInAddis } from "@/lib/services/homepage"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// A live countdown to a fixed moment, so it can't restart when the page reloads:
// either the admin's end date (homepage_sections.promo.ends_at) or, for
// "today's" deals, midnight in Addis Ababa. With `rolling`, reaching midnight
// moves on to the next one instead of ending; without it the clock stops at 0.
//
// `initialRemainingMs` is computed on the server and used for the first render,
// so the server HTML and the browser's first paint agree (no hydration
// mismatch); right after mounting, the browser switches to its own clock and
// ticks once a second. Shared by the phone carousel's pill and the deal popup.
function useDealCountdown(endsAt: string, initialRemainingMs: number, rolling: boolean): number {
  const [remaining, setRemaining] = useState(initialRemainingMs)

  useEffect(() => {
    let end = Date.parse(endsAt)
    const tick = () => {
      const now = Date.now()
      if (rolling && end <= now) end = Date.parse(endOfDayInAddis(now))
      const left = Math.max(0, end - now)
      setRemaining(left)
      // A fixed end date that has passed stays passed: stop ticking.
      if (left === 0) clearInterval(timer)
    }
    const timer = setInterval(tick, SECOND)
    tick()
    return () => clearInterval(timer)
  }, [endsAt, rolling])

  return remaining
}

/** Splits milliseconds into whole days, hours, minutes and seconds. */
function countdownParts(remaining: number) {
  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
  }
}

// One short line ("Deal ends in 05:12:33") for the phone carousel's deals
// slide, where a card of tiles would cover most of the photograph.
function DealsCountdown({
  endsAt,
  initialRemainingMs,
  rolling = false,
}: {
  endsAt: string
  initialRemainingMs: number
  rolling?: boolean
}) {
  const t = useT()
  const remaining = useDealCountdown(endsAt, initialRemainingMs, rolling)

  if (remaining <= 0) {
    return (
      <p className="w-fit rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-medium text-charcoal shadow-lift">
        {t("home.deals.ended")}
      </p>
    )
  }

  const { days, hours, minutes, seconds } = countdownParts(remaining)
  return (
    // role="timer" is not announced on every tick (its live region is off by
    // default), which is what we want; the label says what it counts.
    <div
      role="timer"
      aria-label={t("home.deals.timeLeft")}
      className="flex w-fit items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-sm shadow-lift"
    >
      <span className="font-medium text-muted-text">{t("home.deals.endsIn")}</span>
      <span className="font-semibold text-charcoal tabular-nums">
        {days > 0 && `${days} ${t("home.deals.days")} `}
        {[hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")}
      </span>
    </div>
  )
}

export { DealsCountdown, useDealCountdown, countdownParts }
