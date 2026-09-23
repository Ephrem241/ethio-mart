import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="text-burgundy hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm linkExpired={params.error === "expired"} />
    </AuthCard>
  )
}
