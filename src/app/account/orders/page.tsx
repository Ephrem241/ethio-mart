import { AccountOrdersContent } from "@/components/account/account-orders-content"

export default function AccountOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Your orders</h1>
        <p className="text-muted-text">Track and review your order history.</p>
      </div>
      <AccountOrdersContent />
    </div>
  )
}
