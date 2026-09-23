import { PackageX } from "lucide-react"
import { EmptyState } from "@/components/feedback/empty-state"

export default function ProductNotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={PackageX}
        title="Product not found."
        description="This product may have been removed or is no longer available."
      />
    </div>
  )
}
