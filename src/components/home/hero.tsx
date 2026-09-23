import Link from "next/link"

import type { HomepageSettings } from "@/lib/services/homepage"
import { Button } from "@/components/ui/button"

function Hero({ settings }: { settings: HomepageSettings }) {
  return (
    <section className="grid items-center gap-10 py-6 lg:grid-cols-2 lg:gap-16 lg:py-10">
      <div className="space-y-6">
        <h1 className="text-3xl leading-tight font-semibold text-charcoal sm:text-4xl lg:text-5xl">
          {settings.heroHeadline}
        </h1>
        <p className="max-w-md text-base text-muted-text">{settings.heroSubtext}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href={settings.heroCtaHref}>{settings.heroCtaLabel}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={settings.heroSecondaryCtaHref}>{settings.heroSecondaryCtaLabel}</Link>
          </Button>
        </div>
      </div>
      <div className="relative min-h-[260px] overflow-hidden rounded-card bg-linear-to-br from-sand via-ivory to-sand/60 lg:min-h-[400px]">
        <div className="absolute -top-10 -right-10 size-56 rounded-full bg-burgundy/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 size-64 rounded-full bg-burgundy-dark/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 size-40 rounded-full bg-sand blur-2xl" />
      </div>
    </section>
  )
}

export { Hero }
