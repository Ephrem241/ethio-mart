import Link from "next/link"

import type { HomepageSettings } from "@/lib/services/homepage"
import { Button } from "@/components/ui/button"

function PromoBanner({ settings }: { settings: HomepageSettings }) {
  return (
    <section className="overflow-hidden rounded-card bg-burgundy px-6 py-10 text-center text-white sm:px-10 lg:py-14">
      <p className="text-sm font-medium tracking-wide text-white/70 uppercase">{settings.promoEyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{settings.promoHeadline}</h2>
      <p className="mx-auto mt-2 max-w-md text-white/80">{settings.promoSubtext}</p>
      <Button asChild size="lg" variant="secondary" className="mt-6">
        <Link href={settings.promoCtaHref}>{settings.promoCtaLabel}</Link>
      </Button>
    </section>
  )
}

export { PromoBanner }
