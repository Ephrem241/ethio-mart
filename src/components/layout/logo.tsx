import Link from "next/link"
import { cn } from "cn"

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-lg font-semibold tracking-tight text-burgundy",
        className
      )}
    >
      Ethio Mart
    </Link>
  )
}

export { Logo }
