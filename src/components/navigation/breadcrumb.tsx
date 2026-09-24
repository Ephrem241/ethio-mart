import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { getT } from "@/lib/i18n/server"

async function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const t = await getT()

  return (
    <nav aria-label={t("nav.breadcrumb")} className="flex items-center gap-1.5 text-sm text-muted-text">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-forest">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-charcoal">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

export { Breadcrumb }
