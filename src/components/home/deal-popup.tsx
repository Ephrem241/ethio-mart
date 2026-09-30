"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Image, { getImageProps } from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, m } from "framer-motion"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ArrowRight, Timer, XIcon } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import {
  DEAL_POPUP_DELAY_MS,
  readDealPopupMemory,
  rememberDealPopupShown,
  shouldAutoOpenDealPopup,
} from "@/lib/deal-popup"
import { Button } from "@/components/ui/button"
import { countdownParts, useDealCountdown } from "@/components/home/deals-countdown"

// The homepage's "limited time deal" popup: the admin's promo copy
// (homepage_sections.promo, localized and with {maxDiscount} filled in by the
// page), a live countdown to the promo's real end, and a button to the deals.
//
// It never opens straight away: a few seconds after the homepage loads, once
// per browsing session (see lib/deal-popup.ts), and never while the shopper is
// typing or another dialog is open. After that, a small floating button
// reopens it. It is only rendered by the homepage, so it can't follow the
// shopper into product pages or checkout.
//
// Phones get a bottom sheet (a card resting just above the bottom edge);
// tablets and desktops a centred card. Radix supplies the dialog semantics,
// Escape, the focus trap and the page scroll lock; framer-motion (through the
// site's MotionProvider, which honours reduced motion) the open/close motion.
//
// When a fixed end date passes, the popup says the offer has ended, the
// floating button goes away, and the page is refreshed once so the server can
// send whatever promotion is current now (today's deals, or none).

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// The existing Special Deals photograph (also the phone carousel's deals slide).
const PHOTO = {
  src: "/images/home/deals-kitchen.jpg",
  sizes: "(min-width: 640px) 456px, calc(100vw - 48px)",
}

// The photo only renders once the popup opens, so it would still be loading
// as the card appears. Fetch it a little before then (by the time the page's
// own images are done), with the same srcset the <Image> will ask for, so the
// browser picks the same file and it is in the cache.
function warmPhoto() {
  const { props } = getImageProps({ ...PHOTO, alt: "", fill: true })
  const img = new window.Image()
  if (props.sizes) img.sizes = props.sizes
  if (props.srcSet) img.srcset = props.srcSet
  img.src = props.src
}

interface DealPopupProps {
  eyebrow: string
  headline: string
  subtext: string
  ctaLabel: string
  ctaHref: string
  /** The biggest discount currently on sale, for the floating button. */
  percent: number
  endsAt: string
  initialRemainingMs: number
  rolling: boolean
}

// Storage has no change event within the tab; the value is re-read each render.
const subscribeToNothing = () => () => {}

// Someone typing (the header search) or in another dialog is not interrupted.
function shopperIsBusy(): boolean {
  const el = document.activeElement
  const typing =
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  return typing || document.querySelector('[role="dialog"], [role="alertdialog"]') !== null
}

function DealPopup({
  eyebrow,
  headline,
  subtext,
  ctaLabel,
  ctaHref,
  percent,
  endsAt,
  initialRemainingMs,
  rolling,
}: DealPopupProps) {
  const t = useT()
  const router = useRouter()
  const remaining = useDealCountdown(endsAt, initialRemainingMs, rolling)
  const active = remaining > 0

  const [open, setOpen] = useState(false)
  // Shown already in this session (or very recently in another tab): the
  // floating button takes over from here. Read from storage on every render
  // (the server has none, so its HTML never has the button); `openedHere`
  // covers browsers where storage is unavailable.
  const [openedHere, setOpenedHere] = useState(false)
  const remembered = useSyncExternalStore(
    subscribeToNothing,
    () => !shouldAutoOpenDealPopup(readDealPopupMemory(), Date.now()),
    () => false
  )
  const seen = openedHere || remembered
  // Where focus goes back to on close (Radix only returns it to a Trigger).
  const openerRef = useRef<HTMLElement | null>(null)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  // The one automatic opening.
  useEffect(() => {
    if (!shouldAutoOpenDealPopup(readDealPopupMemory(), Date.now())) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let warmTimer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(attempt, DEAL_POPUP_DELAY_MS)
      warmTimer ??= setTimeout(warmPhoto, DEAL_POPUP_DELAY_MS / 2)
    }
    const attempt = () => {
      if (!activeRef.current) return stop()
      if (document.visibilityState !== "visible") return // resumes on return
      if (shopperIsBusy()) return schedule()
      stop()
      rememberDealPopupShown(Date.now())
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpenedHere(true)
      setOpen(true)
    }
    // The wait only counts while the tab is in front: a tab opened in the
    // background gets its full delay once the shopper actually looks at it.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") schedule()
      else clearTimeout(timer)
    }
    const stop = () => {
      clearTimeout(timer)
      clearTimeout(warmTimer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    if (document.visibilityState === "visible") schedule()
    return stop
  }, [])

  // A fixed end date has passed: ask the server (once per end date) for the
  // promotion that is current now. If there is one, it arrives as new props
  // and the countdown restarts; if not, the page stops rendering the popup.
  const refreshedFor = useRef<string | null>(null)
  useEffect(() => {
    if (active || rolling || refreshedFor.current === endsAt) return
    refreshedFor.current = endsAt
    router.refresh()
  }, [active, rolling, endsAt, router])

  const { days, hours, minutes, seconds } = countdownParts(remaining)
  const clock = [
    ...(days > 0 ? [{ value: days, label: t("home.deals.days") }] : []),
    { value: hours, label: t("home.deals.hours") },
    { value: minutes, label: t("home.deals.minutes") },
    { value: seconds, label: t("home.deals.seconds") },
  ]

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal key="deal-popup" forceMount>
              <DialogPrimitive.Overlay forceMount asChild>
                <m.div
                  className="fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-[3px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </DialogPrimitive.Overlay>
              {/* Positions the card; lets clicks through to the overlay (which closes it). */}
              <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pt-3 pr-[max(12px,env(safe-area-inset-right))] pb-[calc(12px+env(safe-area-inset-bottom))] pl-[max(12px,env(safe-area-inset-left))] sm:items-center sm:p-4">
                <DialogPrimitive.Content
                  forceMount
                  asChild
                  aria-modal="true"
                  onCloseAutoFocus={(event) => {
                    const opener = openerRef.current
                    if (opener?.isConnected && opener !== document.body) {
                      event.preventDefault()
                      opener.focus({ preventScroll: true })
                    }
                  }}
                >
                  <m.div
                    className="pointer-events-auto relative flex max-h-[75dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-[1.75rem] bg-[linear-gradient(165deg,var(--color-forest)_0%,var(--color-forest-dark)_100%)] text-white shadow-[0_28px_70px_-18px_rgb(0_0_0/0.6)] ring-1 ring-gold/25 outline-none sm:max-h-[min(600px,calc(100dvh-2rem))] sm:w-[480px]"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18, ease: "easeIn" } }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                  >
                    {/* First in the DOM so it is where focus lands on opening. */}
                    <DialogPrimitive.Close asChild>
                      <button
                        type="button"
                        className="absolute top-5 right-5 z-10 flex size-11 items-center justify-center rounded-full bg-forest-dark/85 text-white ring-1 ring-white/20 backdrop-blur-sm transition-[background-color,scale] outline-none hover:bg-forest-dark focus-visible:ring-3 focus-visible:ring-gold active:scale-95"
                      >
                        <XIcon aria-hidden className="size-5" />
                        <span className="sr-only">{t("common.close")}</span>
                      </button>
                    </DialogPrimitive.Close>

                    <div className="relative m-3 mb-0 aspect-[5/2] shrink-0 overflow-hidden rounded-[1.25rem] bg-forest-dark sm:aspect-[21/10]">
                      <Image
                        src={PHOTO.src}
                        alt={t("home.deals.imageAlt")}
                        fill
                        sizes={PHOTO.sizes}
                        className={cn("object-cover object-[45%_55%]", !active && "grayscale")}
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-linear-to-t from-forest-dark/75 via-forest-dark/10 to-transparent"
                      />
                      {active && (
                        <p className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-forest-dark/85 px-3 py-1 text-xs font-medium text-white ring-1 ring-gold/40">
                          <Timer aria-hidden className="size-3.5 text-gold" />
                          {t("home.deals.limitedTime")}
                        </p>
                      )}
                    </div>

                    <div className="px-6 pt-5 pb-6 sm:px-7 sm:pb-5">
                      {active && (
                        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-gold uppercase">{eyebrow}</p>
                      )}
                      <DialogPrimitive.Title className="font-display text-[1.75rem] leading-[1.1] font-semibold sm:text-4xl">
                        {active ? headline : t("home.deals.ended")}
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
                        {active ? subtext : t("home.dealPopup.endedText")}
                      </DialogPrimitive.Description>

                      {active && (
                        // role="timer" is not announced on every tick (its live
                        // region is off by default); the label says what it counts.
                        <div role="timer" aria-label={t("home.deals.timeLeft")} className="mt-4 sm:mt-5">
                          <p className="text-xs font-medium text-white/80">{t("home.deals.endsIn")}</p>
                          <div className="mt-2 flex gap-2">
                            {clock.map((part) => (
                              <div
                                key={part.label}
                                className="flex flex-1 flex-col items-center rounded-xl bg-white/[0.07] py-2.5 ring-1 ring-gold/30 ring-inset"
                              >
                                <span className="text-2xl leading-none font-semibold tabular-nums sm:text-[1.75rem]">
                                  {String(part.value).padStart(2, "0")}
                                </span>
                                <span className="mt-1.5 text-[11px] leading-none text-gold">{part.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-1.5">
                        {active ? (
                          <>
                            <Button
                              size="lg"
                              asChild
                              className="w-full bg-copper text-forest-dark hover:bg-[color-mix(in_srgb,var(--color-copper),white_16%)] focus-visible:border-gold focus-visible:ring-gold/60 active:bg-[color-mix(in_srgb,var(--color-copper),black_8%)]"
                            >
                              <Link href={ctaHref} onClick={() => setOpen(false)}>
                                {ctaLabel}
                                <ArrowRight aria-hidden />
                              </Link>
                            </Button>
                            <DialogPrimitive.Close asChild>
                              <Button
                                size="lg"
                                variant="ghost"
                                className="w-full text-white hover:bg-white/10 hover:text-white focus-visible:border-gold focus-visible:ring-gold/60 active:bg-white/15"
                              >
                                {t("home.dealPopup.notNow")}
                              </Button>
                            </DialogPrimitive.Close>
                          </>
                        ) : (
                          <DialogPrimitive.Close asChild>
                            <Button
                              size="lg"
                              className="w-full bg-copper text-forest-dark hover:bg-[color-mix(in_srgb,var(--color-copper),white_16%)] focus-visible:border-gold focus-visible:ring-gold/60"
                            >
                              {t("common.close")}
                            </Button>
                          </DialogPrimitive.Close>
                        )}
                      </div>
                    </div>
                  </m.div>
                </DialogPrimitive.Content>
              </div>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>

      {/* Reopens the popup once it has been seen, while the deal lasts. Phones:
          above the bottom navigation; it stays mounted (faded out) while the
          popup is open so focus can come back to it. */}
      <AnimatePresence>
        {seen && active && (
          <m.button
            key="deal-badge"
            type="button"
            aria-haspopup="dialog"
            aria-label={t("home.dealPopup.badgeLabel", { percent })}
            tabIndex={open ? -1 : undefined}
            onClick={(event) => {
              openerRef.current = event.currentTarget
              setOpen(true)
            }}
            className={cn(
              "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex h-11 items-center gap-1.5 rounded-full bg-forest pr-4 pl-3.5 text-sm font-semibold text-white shadow-lift ring-1 ring-gold/50 transition-colors outline-none hover:bg-forest-dark focus-visible:ring-3 focus-visible:ring-gold active:bg-forest-dark lg:right-6 lg:bottom-6",
              open && "pointer-events-none"
            )}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={open ? { opacity: 0, y: 0, scale: 0.9 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <Timer aria-hidden className="size-4 text-gold" />
            {t("home.dealPopup.badge", { percent })}
          </m.button>
        )}
      </AnimatePresence>
    </>
  )
}

export { DealPopup }
