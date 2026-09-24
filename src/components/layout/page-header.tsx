import type { ReactNode } from "react"
import { cn } from "cn"

import { Breadcrumb } from "@/components/navigation/breadcrumb"

// The top of an inner page: optional breadcrumb, a serif title, a short
// description. `variant="band"` (shop, categories, a category) sits it in a
// soft cream panel and can carry a picture on the right (`aside`);
// `variant="plain"` (cart, checkout) is just the text — those pages are tasks,
// not browsing, so they get no decoration.
async function PageHeader({
  breadcrumb,
  title,
  description,
  aside,
  variant = "band",
  className,
}: {
  breadcrumb?: { label: string; href?: string }[]
  title: string
  description?: string
  aside?: ReactNode
  variant?: "band" | "plain"
  className?: string
}) {
  const band = variant === "band"

  return (
    <header
      className={cn(
        band && "rounded-hero bg-cream/70 px-5 py-7 sm:px-10 sm:py-9 lg:flex lg:items-center lg:justify-between lg:gap-10",
        className
      )}
    >
      <div className="min-w-0 space-y-3">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <h1 className="font-display text-3xl leading-tight font-semibold text-charcoal sm:text-4xl">{title}</h1>
        {description && <p className="max-w-xl text-charcoal/70 sm:text-lg">{description}</p>}
      </div>
      {aside && <div className="mt-6 lg:mt-0 lg:w-[38%] lg:shrink-0">{aside}</div>}
    </header>
  )
}

export { PageHeader }
