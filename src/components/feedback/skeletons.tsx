"use client"

import type { ReactNode } from "react"

import { useT } from "@/lib/i18n/provider"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton"

// Placeholders shown while a page's data is still on its way (spec Section 42:
// "never show an empty white screen while data loads"). Each one mimics the
// shape of the content it stands in for, so the page doesn't jump when the
// real content arrives. They are announced to screen readers as one "Loading"
// status instead of a dozen empty boxes.
function LoadingRegion({ children, className }: { children: ReactNode; className?: string }) {
  const t = useT()

  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t("common.loading")}</span>
      <div aria-hidden>{children}</div>
    </div>
  )
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-border bg-card p-5 ${className}`}>{children}</div>
}

// A list of order / address cards.
function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <LoadingRegion className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </Card>
      ))}
    </LoadingRegion>
  )
}

// A data table (admin lists).
function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <LoadingRegion>
      <div className="overflow-hidden rounded-card border border-border bg-card">
        <div className="flex gap-4 border-b border-border bg-muted/40 p-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b border-border p-3 last:border-b-0">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}

// A single form card (profile, settings, admin editors).
function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <LoadingRegion>
      <Card className="max-w-md space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="h-8 w-32" />
      </Card>
    </LoadingRegion>
  )
}

// Admin dashboard: four stat cards and two panels.
function DashboardSkeleton() {
  return (
    <LoadingRegion className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-2 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, r) => (
              <Skeleton key={r} className="h-5 w-full" />
            ))}
          </Card>
        ))}
      </div>
    </LoadingRegion>
  )
}

// An order page: title row, then items/address beside payment/timeline.
function OrderDetailSkeleton() {
  return (
    <LoadingRegion className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <Card className="space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-14 shrink-0 rounded-image" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </Card>
          <Card className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-2">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </Card>
          <Card className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </Card>
        </div>
      </div>
    </LoadingRegion>
  )
}

// The cart: lines beside the summary card.
function CartSkeleton() {
  return (
    <LoadingRegion>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border py-4 last:border-b-0">
              <Skeleton className="size-20 shrink-0 rounded-image sm:size-24" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
        <Card className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </Card>
      </div>
    </LoadingRegion>
  )
}

// Checkout: the form beside the order review.
function CheckoutSkeleton() {
  return (
    <LoadingRegion>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <Card className="space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </Card>
          <Card className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full" />
          </Card>
        </div>
        <Card className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </Card>
      </div>
    </LoadingRegion>
  )
}

// A signed-in page whose shell has not finished loading (admin).
function PageSkeleton() {
  return (
    <LoadingRegion className="space-y-6 py-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-64 w-full rounded-card" />
    </LoadingRegion>
  )
}

// A product page: photo beside the name, price and buttons.
function ProductDetailsSkeleton() {
  return (
    <LoadingRegion className="space-y-8 py-8">
      <Skeleton className="h-4 w-64 max-w-full" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-image" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  )
}

// The favorites grid.
function FavoritesSkeleton() {
  return (
    <LoadingRegion>
      <ProductGridSkeleton count={6} />
    </LoadingRegion>
  )
}

export {
  CardListSkeleton,
  TableSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  OrderDetailSkeleton,
  CartSkeleton,
  CheckoutSkeleton,
  PageSkeleton,
  ProductDetailsSkeleton,
  FavoritesSkeleton,
}
