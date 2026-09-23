import { ListingSkeleton } from "@/components/catalog/listing-skeleton"

export default function SearchLoading() {
  return (
    <div className="py-8">
      <ListingSkeleton />
    </div>
  )
}
