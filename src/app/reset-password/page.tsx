import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <p>
          Link not working?{" "}
          <Link href="/forgot-password" className="text-burgundy hover:underline">
            Request a new one
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  )
}
