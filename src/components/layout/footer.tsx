import type { ReactNode } from "react"
import Link from "next/link"
import { Banknote } from "lucide-react"
import { cn } from "cn"

import { BRAND_NAME } from "@/lib/brand"
import { nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import type { MessageKey } from "@/lib/i18n/translator"
import { getNavCategories } from "@/lib/services/nav-queries"
import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Newsletter } from "@/components/home/newsletter"
import { MobileCollapsible } from "@/components/ui/mobile-collapsible"

const columns: { id: string; title: MessageKey; links: { href: string; label: MessageKey }[] }[] = [
  {
    id: "footer-service",
    title: "footer.customerService",
    links: [
      { href: "/contact", label: "footer.contact" },
      { href: "/delivery", label: "footer.delivery" },
      { href: "/returns", label: "footer.returns" },
      { href: "/faq", label: "footer.faq" },
    ],
  },
  {
    id: "footer-company",
    title: "footer.company",
    links: [
      { href: "/about", label: "footer.about" },
      { href: "/privacy", label: "footer.privacy" },
      { href: "/terms", label: "footer.terms" },
    ],
  },
]

// How many categories the Shop column lists before "All categories".
const SHOP_LINKS = 5

// Below `lg` every link is a full 44px row inside its folding section.
const linkClass =
  "rounded text-sm text-white/70 underline-offset-4 transition-colors outline-none hover:text-white hover:underline focus-visible:text-white focus-visible:underline max-lg:flex max-lg:min-h-11 max-lg:items-center"
const listClass = "space-y-2 max-lg:space-y-0 max-lg:pb-2"
const headingClass = "text-xs font-semibold tracking-[0.16em] text-gold uppercase"
// The phone toggle row, styled like the desktop column heading.
const triggerClass =
  "min-h-12 px-0 font-sans text-xs tracking-[0.16em] text-gold uppercase active:bg-white/5 focus-visible:ring-gold/50"

// One link column. From `lg` up: a heading and the list, as always. Below it:
// a row that folds the list away (closed by default), so the footer is a few
// short rows on a phone instead of a long page of links. The links stay in the
// HTML either way (closed only hides them with CSS below `lg`).
function FooterColumn({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <nav aria-labelledby={id} className="space-y-3 max-lg:space-y-0 max-lg:border-b max-lg:border-white/10">
      <h2 id={id} className={cn(headingClass, "max-lg:hidden")}>
        {title}
      </h2>
      <MobileCollapsible id={`${id}-links`} label={title} triggerClassName={triggerClass}>
        {children}
      </MobileCollapsible>
    </nav>
  )
}

// The closing band: dark forest, white type, gold accents. The Shop column
// lists the shop's own categories (from the database), so it can never point
// at one that doesn't exist.
async function Footer() {
  const [t, categories] = await Promise.all([getT(), getNavCategories()])

  return (
    // Bottom padding on phones: room for the fixed bottom bar (BottomNav, or
    // the product page's buy bar) — 4rem plus the iPhone home-indicator inset
    // it grows by, so the language switcher in the last row stays clear of it.
    <footer className="mt-8 bg-forest-dark pb-[calc(4rem+env(safe-area-inset-bottom))] text-white/80 lg:pb-0">
      <Container className="grid py-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr] lg:gap-8 lg:py-8">
        <div className="space-y-3 max-lg:space-y-0 max-lg:pb-4">
          <Logo variant="light" />
          {/* Phones show the logo alone: the tagline is the first thing cut for height. */}
          <p className="max-w-xs text-sm leading-relaxed text-white/70 max-lg:hidden">{t("footer.tagline")}</p>
        </div>

        {/* The first folding row gets the top rule; each row draws the one below it. */}
        <div className="max-lg:border-t max-lg:border-white/10 lg:contents">
          <FooterColumn id="footer-shop" title={t("footer.shop")}>
            <ul className={listClass}>
              {categories.slice(0, SHOP_LINKS).map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className={linkClass}>
                    {nameOf(category, t.locale)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className={linkClass}>
                  {t("footer.allCategories")}
                </Link>
              </li>
            </ul>
          </FooterColumn>
        </div>

        {columns.map((column) => (
          <FooterColumn key={column.id} id={column.id} title={t(column.title)}>
            <ul className={listClass}>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>
        ))}

        <div className="space-y-3 max-lg:pt-5">
          <h2 className={headingClass}>{t("home.newsletter.title")}</h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
            {t("home.newsletter.text", { brand: BRAND_NAME })}
          </p>
          <Newsletter />
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-xs text-white/60">
              {t("footer.rights", { year: new Date().getFullYear(), brand: BRAND_NAME })}
            </p>
            {/* Only what checkout really takes — see the homepage's payment strip. */}
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              <Banknote aria-hidden className="size-3.5 text-gold" />
              {t("home.payments.weAccept", { methods: t("home.payments.cod") })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>{t("footer.language")}</span>
            <LanguageSwitcher labels="full" tone="dark" />
          </div>
        </Container>
      </div>
    </footer>
  )
}

export { Footer }
