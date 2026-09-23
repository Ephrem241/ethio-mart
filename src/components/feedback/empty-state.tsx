import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-border bg-card px-6 py-16 text-center",
        className
      )}
    >
      <Icon aria-hidden className="size-10 text-muted-text" />
      <div className="space-y-1">
        <p className="font-medium text-charcoal">{title}</p>
        {description && <p className="text-sm text-muted-text">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
