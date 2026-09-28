import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Desktop size unprefixed (h-10, text-sm), phones and tablets behind
        // `max-lg:` — a 44px, 16px-text field there, so iOS never auto-zooms
        // on focus. This way round, a caller's own plain `h-12`/`text-[15px]`
        // replaces the desktop value exactly as it always did; a caller that
        // wants a different height below `lg` too says so with `max-lg:`.
        // (Text used to drop to 14px at `md`, inside the tablet band — the
        // size that triggers that zoom.)
        "h-10 w-full min-w-0 rounded-xl border border-input bg-card px-3 py-1 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 max-lg:h-11 max-lg:text-base dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
