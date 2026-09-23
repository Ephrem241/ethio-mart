import { AdminHomepageContent } from "@/components/admin/admin-homepage-content"

export default function AdminHomepagePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Homepage</h1>
        <p className="text-muted-text">Edit the hero and promotional banner shown on your storefront.</p>
      </div>
      <AdminHomepageContent />
    </div>
  )
}
