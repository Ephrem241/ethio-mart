"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

function QuantitySelector({
  value,
  onChange,
  max,
  min = 1,
  className,
}: {
  value: number
  onChange: (next: number) => void
  max: number
  min?: number
  className?: string
}) {
  const clamp = (n: number) => Math.min(Math.max(n, min), Math.max(max, min))

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-input", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  )
}

export { QuantitySelector }
