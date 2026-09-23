import { PackageX } from "lucide-react"
import { EmptyState } from "@/components/feedback/empty-state"

export default function CategoryNotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={PackageX}
        title="Category not found."
        description="This category may have been removed or renamed."
      />
    </div>
  )
}
