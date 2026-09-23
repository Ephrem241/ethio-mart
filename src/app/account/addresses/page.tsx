import { AccountAddressesContent } from "@/components/account/account-addresses-content"

export default function AccountAddressesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Addresses</h1>
        <p className="text-muted-text">Manage your saved delivery addresses.</p>
      </div>
      <AccountAddressesContent />
    </div>
  )
}
