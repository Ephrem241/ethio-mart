import Link from "next/link"

import { nameOf } from "@/lib/i18n/content"
import type { Translator } from "@/lib/i18n/translator"
import type { CategoryWithCount } from "@/lib/services/catalog"
import { getCategoryIcon } from "@/components/product/category-icons"

// A circular icon + name — the horizontally-scrolling row of every category on
// phones (see category-section.tsx). The row of photo cards it replaces there
// stays for `lg:` and up.
//
// On phones a chip is a fixed share of the screen — four and a half show,
// whatever the width (with the row's 16px lead-in and 12px gaps) — so there is
// always a half chip at the edge to show that the row scrolls. A fixed width
// happened to fit exactly four at 375 and 390px, with nothing peeking.
function CategoryChip({ category, t }: { category: CategoryWithCount; t: Translator }) {
  const Icon = getCategoryIcon(category.slug)
  const name = nameOf(category, t.locale)

  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex w-[calc((100vw-1rem)/4.5-0.75rem)] shrink-0 flex-col items-center gap-2 rounded-xl text-center transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 sm:w-[76px]"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-cream text-forest sm:size-16">
        {/* getCategoryIcon is a pure lookup into a fixed module-level map (category-icons.ts) —
            the reference it returns is stable across renders, even though the linter can't see that. */}
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Icon aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      {/* Two lines, so "Home & Living" reads in full instead of "Home &…". */}
      <span className="line-clamp-2 text-xs leading-tight font-medium text-charcoal">{name}</span>
    </Link>
  )
}

export { CategoryChip }
