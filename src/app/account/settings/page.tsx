import { AccountSettingsContent } from "@/components/account/account-settings-content"

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Settings</h1>
        <p className="text-muted-text">Manage your account security.</p>
      </div>
      <AccountSettingsContent />
    </div>
  )
}
