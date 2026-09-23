import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"
import { CartButton } from "@/components/layout/cart-button"
import { SearchBar } from "@/components/navigation/search-bar"

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <Container className="flex flex-col gap-3 py-3">
        <div className="flex items-center justify-between">
          <Logo />
          <CartButton />
        </div>
        <SearchBar className="w-full" />
      </Container>
    </header>
  )
}

export { MobileHeader }
