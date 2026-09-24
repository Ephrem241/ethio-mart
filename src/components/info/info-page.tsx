import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { formatOrderDate } from "@/lib/date"
import { getT } from "@/lib/i18n/server"
import { PageHeader } from "@/components/layout/page-header"

// The day the current wording of the privacy policy and terms was written.
// Bump it whenever those pages change in substance.
export const LEGAL_LAST_UPDATED = "2026-09-24"

const linkClass =
  "rounded font-medium text-forest underline underline-offset-4 outline-none transition-colors hover:text-forest-dark focus-visible:ring-2 focus-visible:ring-forest/40"

// Frame for the footer's information pages (contact, delivery, returns, FAQ,
// about, privacy, terms): a breadcrumb and title band, then one narrow column
// of readable sections. These are reading pages — no cards-in-cards, no motion.
async function InfoPage({
  title,
  description,
  updated,
  children,
}: {
  title: string
  description: string
  updated?: string // ISO date, shown as "Last updated"
  children: ReactNode
}) {
  const t = await getT()

  return (
    <div className="space-y-8 py-6 lg:py-8">
      <PageHeader
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: title }]}
        title={title}
        description={description}
      />
      <div className="mx-auto max-w-3xl space-y-10 pb-4">
        {updated && (
          <p className="text-sm text-muted-text">
            {t("info.common.lastUpdated", { date: formatOrderDate(`${updated}T12:00:00Z`, t.locale) })}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

// One titled block of copy. `link` adds a "→ Delivery Information"-style
// pointer under it, for the places the copy refers to another page (the label
// arrives already translated).
function InfoSection({
  title,
  link,
  children,
}: {
  title: string
  link?: { href: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">{title}</h2>
      <div className="space-y-3 leading-relaxed text-charcoal/80">{children}</div>
      {link && <InfoLink href={link.href}>{link.label}</InfoLink>}
    </section>
  )
}

function InfoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${linkClass} inline-flex items-center gap-1.5`}>
      {children}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  )
}

// A bulleted list inside a section (the data the privacy policy lists).
function InfoList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 ps-5 marker:text-gold">{children}</ul>
}

// The closing "Still have a question?" strip. The FAQ page itself leaves out
// the link to the FAQ.
async function InfoHelp({ title, text, showFaq = true }: { title: string; text: string; showFaq?: boolean }) {
  const t = await getT()

  return (
    <aside className="space-y-3 rounded-card bg-cream/70 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-charcoal">{title}</h2>
      <p className="text-charcoal/70">{text}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <InfoLink href="/contact">{t("info.common.contactLink")}</InfoLink>
        {showFaq && <InfoLink href="/faq">{t("info.common.faqLink")}</InfoLink>}
      </div>
    </aside>
  )
}

export { InfoPage, InfoSection, InfoLink, InfoList, InfoHelp, linkClass }
