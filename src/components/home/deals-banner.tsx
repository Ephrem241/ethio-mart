import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { remainingUntil, type HomepageSettings } from "@/lib/services/homepage"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { DealsCountdown } from "@/components/home/deals-countdown"

// "Special Deals": a wide forest-green banner — white type, a gold accent — with
// warm kitchen photography on the right. Its words are the admin-edited promo
// copy (homepage_sections.promo); "Up to {maxDiscount}% Off" is filled with the
// real biggest discount by the page before it gets here.
//
// The countdown is shown ONLY for a real end date that is still in the future.
// With no end date there is simply no countdown (and no "limited time" claim);
// the button is the call to action.
async function DealsBanner({ settings }: { settings: HomepageSettings }) {
  const t = await getT()

  // Server time is only used for the first paint; the browser then keeps its own.
  const remaining = remainingUntil(settings.promoEndsAt)
  const showCountdown = remaining > 0

  return (
    <Reveal>
      <section
        aria-labelledby="deals-heading"
        className="relative isolate overflow-hidden rounded-hero bg-forest text-white lg:min-h-[360px]"
      >
        <div className="relative z-10 flex flex-col items-start px-6 pt-9 pb-7 sm:px-10 lg:min-h-[360px] lg:w-[46%] lg:justify-center lg:py-12 lg:pl-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">{settings.promoEyebrow}</p>
          <h2
            id="deals-heading"
            className="mt-3 font-display text-4xl leading-[1.1] font-semibold sm:text-5xl"
          >
            {settings.promoHeadline}
          </h2>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/80">{settings.promoSubtext}</p>
          <Button
            size="lg"
            asChild
            className="mt-7 bg-gold text-forest-dark hover:bg-[color-mix(in_srgb,var(--color-gold),white_18%)]"
          >
            <Link href={settings.promoCtaHref}>
              {settings.promoCtaLabel}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="relative h-[230px] sm:h-[300px] lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:h-auto lg:w-[60%]">
          <Image
            src="/images/home/deals-kitchen.jpg"
            alt={t("home.deals.imageAlt")}
            fill
            sizes="(min-width: 1024px) 770px, 100vw"
            className="object-cover object-[45%_50%]"
          />
          {/* Blends the photograph into the green: from the left on desktop, from the top on phones. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,var(--color-forest)_0%,rgb(18_60_53/0.72)_16%,rgb(18_60_53/0)_46%)] lg:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-forest to-transparent lg:hidden"
          />
        </div>

        {showCountdown && (
          <div className="relative z-10 px-6 pt-5 pb-7 sm:px-10 lg:absolute lg:top-8 lg:right-8 lg:p-0">
            <DealsCountdown endsAt={settings.promoEndsAt} initialRemainingMs={remaining} />
          </div>
        )}
      </section>
    </Reveal>
  )
}

export { DealsBanner }
