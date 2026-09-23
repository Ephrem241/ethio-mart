import Link from "next/link"
import { Heart } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"
import { CartButton } from "@/components/layout/cart-button"
import { AccountButton } from "@/components/layout/account-button"
import { SearchBar } from "@/components/navigation/search-bar"
import { DesktopNav } from "@/components/navigation/desktop-nav"
import { Button } from "@/components/ui/button"

function Header() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur lg:block">
      <Container className="flex h-16 items-center gap-6">
        <Logo />
        <SearchBar className="ml-4 w-full max-w-md" />
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account/favorites" aria-label="Favorites">
              <Heart />
            </Link>
          </Button>
          <CartButton />
          <AccountButton />
        </div>
      </Container>
      <div className="border-t border-border">
        <Container>
          <DesktopNav />
        </Container>
      </div>
    </header>
  )
}

export { Header }
