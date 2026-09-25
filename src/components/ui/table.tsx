import * as React from "react"
import { cn } from "cn"

// `label` names the scrollable wrapper. A table that can scroll sideways must be reachable by
// keyboard (otherwise its hidden columns cannot be read without a mouse), so with a label it
// becomes a focusable region.
// `relative` so visually-hidden text inside the table (an sr-only header) is positioned and
// clipped by THIS scroller; without it the hidden text sits at the table's far edge, outside
// the clipping, and stretches the whole page sideways on a phone.
function Table({ className, label, ...props }: React.ComponentProps<"table"> & { label?: string }) {
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      className="relative w-full overflow-x-auto rounded-card border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("bg-sand/30", className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-border last:border-b-0 hover:bg-sand/10", className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("h-10 px-3 text-left text-xs font-medium text-muted-text whitespace-nowrap", className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-2 align-middle text-charcoal", className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
