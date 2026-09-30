import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { dealsCountdown, type HomepageSettings } from "@/lib/services/homepage"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { DealsCountdown } from "@/components/home/deals-countdown"

// The phone carousel's second and third slides: the Special Deals and
// lifestyle banners — the same words, pictures and links as the deal popup
// (deal-popup.tsx) and the desktop lifestyle section (lifestyle-banner.tsx),
// shaped like the hero slide beside them. Each fills its slide: the photograph
// on top, taking whatever height the words leave, and the words below it on a
// solid colour, so their contrast never depends on the picture.

async function DealsSlide({ settings }: { settings: HomepageSettings }) {
  const t = await getT()

  return (
    <section
      aria-labelledby="deals-slide-heading"
      className="flex h-full min-h-[360px] flex-col bg-forest text-white sm:min-h-[340px]"
    >
      <div className="relative min-h-24 flex-1">
        <Image
          src="/images/home/deals-kitchen.jpg"
          alt={t("home.deals.imageAlt")}
          fill
          sizes="100vw"
          className="object-cover object-[45%_50%]"
        />
        {/* Blends the photograph into the green below it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-forest to-transparent"
        />
        <Container className="absolute inset-x-0 top-4">
          <DealsCountdown {...dealsCountdown(settings)} />
        </Container>
      </div>
      <Container className="pb-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">{settings.promoEyebrow}</p>
        <h2 id="deals-slide-heading" className="mt-2 font-display text-2xl leading-[1.1] font-semibold sm:text-3xl">
          {settings.promoHeadline}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white sm:text-base">{settings.promoSubtext}</p>
        <Button
          size="lg"
          asChild
          className="mt-4 bg-gold text-forest-dark hover:bg-[color-mix(in_srgb,var(--color-gold),white_18%)]"
        >
          <Link href={settings.promoCtaHref}>
            {settings.promoCtaLabel}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Container>
    </section>
  )
}

async function LifestyleSlide() {
  const t = await getT()

  return (
    <section
      aria-labelledby="lifestyle-slide-heading"
      className="flex h-full min-h-[360px] flex-col bg-cream sm:min-h-[340px]"
    >
      <div className="relative min-h-24 flex-1">
        <Image
          src="/images/home/lifestyle-loft.jpg"
          alt={t("home.lifestyle.imageAlt")}
          fill
          sizes="100vw"
          className="object-cover object-[50%_58%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-cream to-transparent"
        />
      </div>
      <Container className="pb-5">
        <h2
          id="lifestyle-slide-heading"
          className="font-display text-2xl leading-[1.15] font-semibold text-charcoal sm:text-3xl"
        >
          {t("home.lifestyle.title")}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-charcoal sm:text-base">{t("home.lifestyle.text")}</p>
        <Button size="lg" asChild className="mt-4">
          <Link href="/shop">
            {t("home.lifestyle.cta")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Container>
    </section>
  )
}

export { DealsSlide, LifestyleSlide }
