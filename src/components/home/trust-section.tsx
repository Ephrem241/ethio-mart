import { BadgeCheck, Headset, ShieldCheck, Truck } from "lucide-react"

import { BRAND_NAME } from "@/lib/brand"
import { getT } from "@/lib/i18n/server"
import type { MessageKey } from "@/lib/i18n/translator"
import { Reveal } from "@/components/motion/reveal"

// Four plain statements, worded without promises the shop can't keep (no
// "guaranteed", no delivery times) — the same rule as the announcement bar.
const items: { icon: typeof ShieldCheck; title: MessageKey; description: MessageKey }[] = [
  { icon: BadgeCheck, title: "home.trust.qualityTitle", description: "home.trust.qualityText" },
  { icon: ShieldCheck, title: "home.trust.secureTitle", description: "home.trust.secureText" },
  { icon: Truck, title: "home.trust.fastTitle", description: "home.trust.fastText" },
  { icon: Headset, title: "home.trust.supportTitle", description: "home.trust.supportText" },
]

async function TrustSection() {
  const t = await getT()

  return (
    <Reveal>
      <section aria-labelledby="trust-heading" className="space-y-8 rounded-hero bg-cream/70 px-5 py-10 sm:px-10">
        <h2 id="trust-heading" className="font-display text-2xl font-semibold text-charcoal sm:text-[1.75rem]">
          {t("home.trustTitle", { brand: BRAND_NAME })}
        </h2>
        <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.title} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sand/70 text-forest">
                <item.icon aria-hidden className="size-6" strokeWidth={1.6} />
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-charcoal">{t(item.title)}</p>
                <p className="text-sm leading-relaxed text-muted-text">{t(item.description)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}

export { TrustSection }
