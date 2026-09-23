import { AccountFavoritesContent } from "@/components/account/account-favorites-content"

export default function AccountFavoritesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Favorites</h1>
        <p className="text-muted-text">Products you&apos;ve saved for later.</p>
      </div>
      <AccountFavoritesContent />
    </div>
  )
}
