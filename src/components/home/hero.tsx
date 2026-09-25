import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { BRAND_NAME } from "@/lib/brand"
import { getT } from "@/lib/i18n/server"
import type { HomepageSettings } from "@/lib/services/homepage"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

// The homepage's opening: a full-bleed photograph, edge to edge under the
// header, with the text on its left over a cream wash.
//
// The page sits inside the layout's Container, so the section breaks out of it
// (`w-screen` centred on the column) and cancels the page's top padding; an
// inner Container puts the text back on the same left edge as everything below.
// The photograph's left side is a plain wall, so the cream wash reads as light
// on it rather than a panel. Phones get a stronger wash: the text sits over
// more of the picture there, and it has to keep its contrast.
//
// It is the first thing painted, so it uses plain CSS animation (visible even
// before JavaScript runs) and the photograph is preloaded.
async function Hero({ settings }: { settings: HomepageSettings }) {
  const t = await getT()

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative left-1/2 isolate -mt-6 flex min-h-[460px] w-screen -translate-x-1/2 items-center overflow-hidden bg-cream sm:min-h-[400px] lg:-mt-10 lg:min-h-[470px]"
    >
      <Image
        src="/images/home/hero-living-wide.jpg"
        alt={t("home.hero.imageAlt")}
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[62%_50%]"
      />
      {/* The cream wash behind the text: stronger on phones, where the text covers more of the photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(243_236_226/0.96)_0%,rgb(243_236_226/0.85)_55%,rgb(243_236_226/0.4)_100%)] md:bg-[linear-gradient(90deg,rgb(243_236_226/0.98)_0%,rgb(243_236_226/0.91)_30%,rgb(243_236_226/0.18)_67%,rgb(243_236_226/0)_100%)]"
      />

      <Container className="py-12 animate-in fade-in slide-in-from-bottom-3 duration-500 lg:py-16">
        <div className="max-w-xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.24em] text-forest uppercase">
            <span aria-hidden className="h-px w-8 bg-gold" />
            {BRAND_NAME}
          </p>
          <h1
            id="hero-heading"
            className="mt-5 font-display text-[1.9rem] leading-[1.12] font-semibold whitespace-pre-line text-charcoal min-[400px]:text-[2.1rem] sm:text-5xl lg:text-[3.4rem]"
          >
            {settings.heroHeadline}
          </h1>
          {/* Full charcoal, not /80: on phones and tablets these lines run over the photo, and where
              they cross the darker foliage the softer grey measured about 3:1 (AA needs 4.5:1). */}
          <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal sm:text-lg">{settings.heroSubtext}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={settings.heroCtaHref}>
                {settings.heroCtaLabel}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-white/70 backdrop-blur-sm">
              <Link href={settings.heroSecondaryCtaHref}>{settings.heroSecondaryCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

export { Hero }
