import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

// The title row shared by the homepage sections: an editorial serif heading on
// the left and, optionally, a "View All →" link (and any extra controls, such
// as carousel arrows) on the right.
function SectionHeading({
  id,
  title,
  href,
  linkLabel,
  actions,
}: {
  id: string
  title: string
  href?: string
  linkLabel?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 id={id} className="font-display text-2xl font-semibold text-charcoal sm:text-[1.75rem]">
        {title}
      </h2>
      <div className="flex shrink-0 items-center gap-4">
        {href && linkLabel && (
          <Link
            href={href}
            className="group inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-medium text-charcoal/80 transition-colors outline-none hover:text-forest focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {linkLabel}
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        {actions}
      </div>
    </div>
  )
}

export { SectionHeading }
