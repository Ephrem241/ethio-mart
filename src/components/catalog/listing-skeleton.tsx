import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton"

function ListingSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>
      <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </aside>
      <div className="flex-1 space-y-6">
        <div className="hidden items-center justify-between lg:flex">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <ProductGridSkeleton />
      </div>
    </div>
  )
}

export { ListingSkeleton }
