import type { ReactNode } from "react"

function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-12">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-charcoal">{title}</h1>
        {description && <p className="text-sm text-muted-text">{description}</p>}
      </div>
      <div className="rounded-card border border-border bg-card p-6">{children}</div>
      {footer && <div className="space-y-1 text-center text-sm text-muted-text">{footer}</div>}
    </div>
  )
}

export { AuthCard }
