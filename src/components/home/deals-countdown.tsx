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
// moves on to the next one instead of showing "ended".
//
// `initialRemainingMs` is computed on the server and used for the first render,
// so the server HTML and the browser's first paint agree (no hydration
// mismatch); right after mounting, the browser switches to its own clock and
// ticks once a second.
//
// "boxes" is the desktop banner's card of four tiles; "pill" is one short line
// ("Deal ends in 05:12:33") for the phone carousel's slide, where the card
// would cover most of the photograph.
function DealsCountdown({
  endsAt,
  initialRemainingMs,
  rolling = false,
  variant = "boxes",
}: {
  endsAt: string
  initialRemainingMs: number
  rolling?: boolean
  variant?: "boxes" | "pill"
}) {
  const t = useT()
  const [remaining, setRemaining] = useState(initialRemainingMs)

  useEffect(() => {
    let end = Date.parse(endsAt)
    const tick = () => {
      const now = Date.now()
      if (rolling && end <= now) end = Date.parse(endOfDayInAddis(now))
      setRemaining(Math.max(0, end - now))
    }
    tick()
    const timer = setInterval(tick, SECOND)
    return () => clearInterval(timer)
  }, [endsAt, rolling])

  if (remaining <= 0) {
    return (
      <p
        className={
          variant === "pill"
            ? "w-fit rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-medium text-charcoal shadow-lift"
            : "rounded-2xl bg-white/95 px-5 py-4 text-sm font-medium text-charcoal shadow-lift"
        }
      >
        {t("home.deals.ended")}
      </p>
    )
  }

  const parts = [
    { value: Math.floor(remaining / DAY), label: t("home.deals.days") },
    { value: Math.floor((remaining % DAY) / HOUR), label: t("home.deals.hours") },
    { value: Math.floor((remaining % HOUR) / MINUTE), label: t("home.deals.minutes") },
    { value: Math.floor((remaining % MINUTE) / SECOND), label: t("home.deals.seconds") },
  ]

  if (variant === "pill") {
    const [days, ...clock] = parts
    return (
      <div
        role="timer"
        aria-label={t("home.deals.timeLeft")}
        className="flex w-fit items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-sm shadow-lift"
      >
        <span className="font-medium text-muted-text">{t("home.deals.endsIn")}</span>
        <span className="font-semibold text-charcoal tabular-nums">
          {days.value > 0 && `${days.value} ${days.label} `}
          {clock.map((part) => String(part.value).padStart(2, "0")).join(":")}
        </span>
      </div>
    )
  }

  return (
    // role="timer" is not announced on every tick (its live region is off by
    // default), which is what we want; the label says what it counts.
    <div role="timer" aria-label={t("home.deals.timeLeft")} className="rounded-2xl bg-white/95 p-4 shadow-lift">
      <p className="text-xs font-medium text-muted-text">{t("home.deals.endsIn")}</p>
      <div className="mt-2.5 flex gap-2">
        {parts.map((part) => (
          <div key={part.label} className="flex w-[3.75rem] flex-col items-center gap-1">
            <span className="flex h-12 w-full items-center justify-center rounded-xl bg-cream text-xl font-semibold text-charcoal tabular-nums">
              {String(part.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] leading-none text-muted-text">{part.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { DealsCountdown }
