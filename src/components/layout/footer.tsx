import Link from "next/link"
import { Banknote } from "lucide-react"

import { BRAND_NAME } from "@/lib/brand"
import { nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import type { MessageKey } from "@/lib/i18n/translator"
import { getNavCategories } from "@/lib/services/nav-queries"
import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Newsletter } from "@/components/home/newsletter"

const columns: { title: MessageKey; links: { href: string; label: MessageKey }[] }[] = [
  {
    title: "footer.customerService",
    links: [
      { href: "/contact", label: "footer.contact" },
      { href: "/delivery", label: "footer.delivery" },
      { href: "/returns", label: "footer.returns" },
      { href: "/faq", label: "footer.faq" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { href: "/about", label: "footer.about" },
      { href: "/privacy", label: "footer.privacy" },
      { href: "/terms", label: "footer.terms" },
    ],
  },
]

const linkClass =
  "rounded text-sm text-white/70 underline-offset-4 transition-colors outline-none hover:text-white hover:underline focus-visible:text-white focus-visible:underline"
const headingClass = "text-xs font-semibold tracking-[0.16em] text-gold uppercase"

// The closing band: dark forest, white type, gold accents. The Shop column
// lists the shop's own categories (from the database), so it can never point
// at one that doesn't exist.
async function Footer() {
  const [t, categories] = await Promise.all([getT(), getNavCategories()])

  return (
    <footer className="mt-8 bg-forest-dark pb-16 text-white/80 lg:pb-0">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr] lg:gap-8">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Logo variant="light" />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">{t("footer.tagline")}</p>
        </div>

        <nav aria-labelledby="footer-shop" className="space-y-4">
          <h2 id="footer-shop" className={headingClass}>
            {t("footer.shop")}
          </h2>
          <ul className="space-y-2.5">
            {categories.slice(0, 7).map((category) => (
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
        </nav>

        {columns.map((column) => (
          <nav key={column.title} aria-labelledby={column.title} className="space-y-4">
            <h2 id={column.title} className={headingClass}>
              {t(column.title)}
            </h2>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <h2 className={headingClass}>{t("home.newsletter.title")}</h2>
          <p className="text-sm leading-relaxed text-white/70">
            {t("home.newsletter.text", { brand: BRAND_NAME })}
          </p>
          <Newsletter />
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
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
