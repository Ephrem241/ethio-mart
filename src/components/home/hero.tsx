import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { BRAND_NAME } from "@/lib/brand"
import { getT } from "@/lib/i18n/server"
import type { HomepageSettings } from "@/lib/services/homepage"
import { Button } from "@/components/ui/button"

// The homepage's opening: a warm editorial spread.
//
// Desktop — text on the left over cream; the photograph takes the right ~60%
// and dissolves into the cream on its left edge (the gradient below), so the
// two read as one composition instead of a picture stuck beside text.
// Phones — the text comes first, then the photograph full-width in a rounded
// frame; the two-column layout is not squeezed down.
//
// It is the first thing painted, so it uses plain CSS animation (visible even
// before JavaScript runs) and the photograph is preloaded.
async function Hero({ settings }: { settings: HomepageSettings }) {
  const t = await getT()

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden rounded-hero bg-cream lg:min-h-[500px]"
    >
      <div className="relative z-10 flex flex-col px-5 pt-9 pb-2 animate-in fade-in slide-in-from-bottom-3 duration-500 sm:px-10 sm:pt-12 lg:min-h-[500px] lg:w-[46%] lg:justify-center lg:py-14 lg:pr-0 lg:pl-14">
        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.24em] text-forest uppercase">
          <span aria-hidden className="h-px w-8 bg-gold" />
          {BRAND_NAME}
        </p>
        <h1
          id="hero-heading"
          className="mt-5 font-display text-[1.9rem] leading-[1.12] font-semibold whitespace-pre-line text-charcoal min-[400px]:text-[2.1rem] sm:text-5xl"
        >
          {settings.heroHeadline}
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/70 sm:text-lg">{settings.heroSubtext}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href={settings.heroCtaHref}>
              {settings.heroCtaLabel}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={settings.heroSecondaryCtaHref}>{settings.heroSecondaryCtaLabel}</Link>
          </Button>
        </div>
      </div>

      <div className="relative mx-4 mt-6 mb-4 h-[300px] overflow-hidden rounded-3xl sm:mx-10 sm:mb-10 sm:h-[350px] lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:m-0 lg:h-auto lg:w-[62%] lg:rounded-none">
        <Image
          src="/images/home/hero-living.jpg"
          alt={t("home.hero.imageAlt")}
          fill
          preload
          sizes="(min-width: 1024px) 790px, calc(100vw - 32px)"
          className="origin-[88%_50%] scale-[1.22] object-cover object-[62%_50%]"
        />
        {/* Dissolves the photograph's left edge into the cream behind the text. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,var(--color-cream)_0%,rgb(243_236_226/0.9)_12%,rgb(243_236_226/0.45)_28%,rgb(243_236_226/0)_50%)] lg:block"
        />
        {/* A whisper of warmth so the photo sits inside the brand's palette. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gold/[0.06] mix-blend-multiply" />
      </div>
    </section>
  )
}

export { Hero }
