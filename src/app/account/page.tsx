import { AccountProfileContent } from "@/components/account/account-profile-content"

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Profile</h1>
        <p className="text-muted-text">Manage your personal information.</p>
      </div>
      <AccountProfileContent />
    </div>
  )
}
