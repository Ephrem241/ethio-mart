import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"

// The closing editorial band. The photograph fills the banner (a real, sunlit
// open-plan room — home, kitchen and living space in one frame) and the copy
// sits on a soft cream wash at its left, so it stays readable over the picture.
async function LifestyleBanner() {
  const t = await getT()

  return (
    <Reveal>
      <section
        aria-labelledby="lifestyle-heading"
        className="relative isolate overflow-hidden rounded-hero bg-cream lg:min-h-[340px]"
      >
        <div className="relative z-10 flex flex-col items-start px-6 py-9 sm:px-10 lg:min-h-[340px] lg:w-[48%] lg:justify-center lg:py-12 lg:pl-14">
          <h2
            id="lifestyle-heading"
            className="font-display text-3xl leading-[1.15] font-semibold text-charcoal sm:text-4xl"
          >
            {t("home.lifestyle.title")}
          </h2>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-charcoal/75">{t("home.lifestyle.text")}</p>
          <Button size="lg" asChild className="mt-7">
            <Link href="/shop">
              {t("home.lifestyle.cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="relative h-[220px] sm:h-[280px] lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:h-auto lg:w-[64%]">
          <Image
            src="/images/home/lifestyle-loft.jpg"
            alt={t("home.lifestyle.imageAlt")}
            fill
            sizes="(min-width: 1024px) 820px, 100vw"
            className="object-cover object-[50%_58%]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,var(--color-cream)_0%,rgb(243_236_226/0.75)_14%,rgb(243_236_226/0)_44%)] lg:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-cream to-transparent lg:hidden"
          />
        </div>
      </section>
    </Reveal>
  )
}

export { LifestyleBanner }
