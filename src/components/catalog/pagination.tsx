import Link from "next/link"
import { cn } from "cn"

import { buildPageUrl, type RawParams } from "@/components/catalog/listing-url"

function PageLink({
  page,
  disabled,
  rawParams,
  basePath,
  label,
  symbol,
}: {
  page: number
  disabled: boolean
  rawParams: RawParams
  basePath: string
  label: string
  symbol: string
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex size-8 items-center justify-center rounded-lg text-sm text-muted-text/40"
      >
        {symbol}
      </span>
    )
  }

  return (
    <Link
      href={buildPageUrl(basePath, rawParams, page)}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-lg text-sm text-charcoal hover:bg-muted"
    >
      {symbol}
    </Link>
  )
}

function Pagination({
  page,
  totalPages,
  rawParams,
  basePath,
}: {
  page: number
  totalPages: number
  rawParams: RawParams
  basePath: string
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <PageLink
        page={page - 1}
        disabled={page <= 1}
        rawParams={rawParams}
        basePath={basePath}
        label="Previous page"
        symbol="‹"
      />
      {pages.map((p) => (
        <Link
          key={p}
          href={buildPageUrl(basePath, rawParams, p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-sm",
            p === page ? "bg-primary text-primary-foreground" : "text-charcoal hover:bg-muted"
          )}
        >
          {p}
        </Link>
      ))}
      <PageLink
        page={page + 1}
        disabled={page >= totalPages}
        rawParams={rawParams}
        basePath={basePath}
        label="Next page"
        symbol="›"
      />
    </nav>
  )
}

export { Pagination }
