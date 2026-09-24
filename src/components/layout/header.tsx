import Link from "next/link"
import { Heart } from "lucide-react"

import { nameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import { getNavCategories } from "@/lib/services/nav-queries"
import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"
import { CartButton } from "@/components/layout/cart-button"
import { AccountButton } from "@/components/layout/account-button"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { SearchBar } from "@/components/navigation/search-bar"
import { DesktopNav, type NavLink } from "@/components/navigation/desktop-nav"

// How many of the shop's categories get their own link in the second row.
// The rest stay reachable through "Shop All" (the categories page) — a row
// with every category would wrap on a laptop screen.
const NAV_CATEGORY_LIMIT = 6

async function Header() {
  const [t, categories] = await Promise.all([getT(), getNavCategories()])

  const links: NavLink[] = [
    { href: "/", label: t("nav.home") },
    { href: "/shop", label: t("nav.shop") },
    ...categories.slice(0, NAV_CATEGORY_LIMIT).map((category) => ({
      href: `/category/${category.slug}`,
      label: nameOf(category, t.locale),
    })),
    { href: "/deals", label: t("nav.deals") },
    { href: "/categories", label: t("nav.shopAll") },
  ]

  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur-md lg:block">
      <Container className="flex h-[76px] items-center gap-8">
        <Logo />
        <SearchBar className="mx-auto w-full max-w-xl" />
        <div className="flex items-center gap-1">
          <LanguageSwitcher className="mr-3" />
          <AccountButton variant="stacked" />
          <Link
            href="/account/favorites"
            className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-charcoal transition-colors outline-none hover:text-forest focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Heart aria-hidden className="size-[22px]" strokeWidth={1.75} />
            <span className="text-[11px] leading-none font-medium">{t("nav.wishlist")}</span>
          </Link>
          <CartButton variant="stacked" />
        </div>
      </Container>
      <div className="border-t border-border/70">
        <Container>
          <DesktopNav links={links} />
        </Container>
      </div>
    </header>
  )
}

export { Header }
