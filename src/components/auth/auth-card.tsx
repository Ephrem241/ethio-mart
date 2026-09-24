import type { ReactNode } from "react"

// The frame every sign-in/sign-up/reset page sits in: a serif title and a white
// card for the form (the site header above already carries the wordmark).
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
    <div className="mx-auto w-full max-w-md space-y-7 py-10 sm:py-14">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold text-charcoal">{title}</h1>
        {description && <p className="text-sm text-muted-text">{description}</p>}
      </div>
      <div className="rounded-card border border-border/70 bg-card p-6 shadow-soft sm:p-8">{children}</div>
      {footer && <div className="space-y-1 text-center text-sm text-muted-text">{footer}</div>}
    </div>
  )
}

export { AuthCard }
