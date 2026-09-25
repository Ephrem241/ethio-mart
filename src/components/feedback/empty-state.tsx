import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

// Used wherever there is nothing to show yet (empty cart, no results, no
// orders…): a soft icon disc, a serif headline, one line of help, and — when
// there is an obvious next step — a button.
function EmptyState({
  icon: Icon,
  title,
  titleAs: Title = "p",
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  /** Use "h1" when this state IS the whole page (a 404, an error), so the page has a heading. */
  titleAs?: "h1" | "h2" | "p"
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border border-border/70 bg-card px-6 py-14 text-center shadow-soft sm:py-16",
        className
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-cream">
        <Icon aria-hidden className="size-8 text-forest" strokeWidth={1.5} />
      </span>
      <div className="space-y-1.5">
        <Title className="font-display text-xl font-semibold text-charcoal">{title}</Title>
        {description && <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-text">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
