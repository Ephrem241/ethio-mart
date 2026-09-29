"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

// A section that folds away on phones and tablets and is always open on
// desktop (the product page's description, details, delivery and reviews).
//
// It renders two things into its parent: a heading with a toggle button, shown
// below `lg` only, and the content. The parent keeps its own desktop heading
// and hides that below `lg` — so from `lg` up the markup and the look are what
// they always were, with no toggle and nothing that can be closed.
//
// Closed content is hidden with CSS (`data-[state=closed]`, below `lg` only),
// never with the `hidden` attribute or by unmounting it: the server sends the
// same HTML to every screen, so a desktop visitor never sees a section close
// and reopen while the page loads, and the text is always in the page.
function MobileCollapsible({
  id,
  label,
  icon,
  defaultOpen = false,
  className,
  triggerClassName,
  children,
}: {
  /** The content's id, for the button's aria-controls. */
  id: string
  label: ReactNode
  icon?: ReactNode
  defaultOpen?: boolean
  /** Classes for the content wrapper (its padding below `lg`, usually). */
  className?: string
  /** Classes for the toggle button, merged over its defaults (e.g. the dark footer's). */
  triggerClassName?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <h2 className="lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex min-h-14 w-full items-center gap-2.5 px-5 text-left font-display text-lg font-semibold text-charcoal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-cream/60",
            triggerClassName
          )}
        >
          {icon}
          <span className="min-w-0 flex-1">{label}</span>
          <ChevronDown
            aria-hidden
            className={cn("size-5 shrink-0 opacity-70 transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </h2>
      <div id={id} data-state={open ? "open" : "closed"} className={cn("data-[state=closed]:max-lg:hidden", className)}>
        {children}
      </div>
    </>
  )
}

export { MobileCollapsible }
