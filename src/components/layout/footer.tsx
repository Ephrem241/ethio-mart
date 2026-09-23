import Link from "next/link"

import { Container } from "@/components/layout/container"
import { Logo } from "@/components/layout/logo"

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/categories", label: "Categories" },
      { href: "/shop?sort=new", label: "New arrivals" },
      { href: "/deals", label: "Deals" },
    ],
  },
  {
    title: "Customer service",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/delivery", label: "Delivery" },
      { href: "/returns", label: "Returns" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
]

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-muted-text">
            Thoughtfully sourced Ethiopian goods, delivered with care.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="space-y-3">
            <h3 className="text-sm font-semibold text-charcoal">{column.title}</h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-text hover:text-burgundy"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {/* Language switcher: added in Phase 13 once translations exist. */}
      </Container>
      <div className="border-t border-border">
        <Container className="py-4">
          <p className="text-xs text-muted-text">
            © {new Date().getFullYear()} Ethio Mart. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  )
}

export { Footer }
