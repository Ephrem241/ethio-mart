import Link from "next/link"
import { Heart } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"
import { CartButton } from "@/components/layout/cart-button"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { SearchBar } from "@/components/navigation/search-bar"
import { Button } from "@/components/ui/button"

// Phones: a slim sticky row (logo, language, wishlist, cart) with the search
// bar directly beneath it. Search is never tucked into a menu — but it also
// scrolls away with the page instead of pinning ~60px more of a small screen
// to the top, so only the slim row is sticky.
async function MobileHeader() {
  const t = await getT()

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between gap-2">
          <Logo />
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher compact className="mr-1" />
            {/* Below 360px there isn't room for a third icon; the wishlist is
                still one tap away via Profile in the bottom navigation. */}
            <Button variant="ghost" size="icon-lg" asChild className="max-[359px]:hidden">
              <Link href="/account/favorites" aria-label={t("nav.wishlist")}>
                <Heart aria-hidden className="size-[22px]" strokeWidth={1.75} />
              </Link>
            </Button>
            <CartButton />
          </div>
        </Container>
      </header>
      <Container className="pt-3 pb-1">
        <SearchBar size="lg" className="w-full" />
      </Container>
    </div>
  )
}

export { MobileHeader }
