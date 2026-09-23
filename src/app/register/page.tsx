import Link from "next/link"

import { getSafeRedirect } from "@/lib/safe-redirect"
import { AuthCard } from "@/components/auth/auth-card"
import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const redirectTo = getSafeRedirect(params.redirect, "/account")

  return (
    <AuthCard
      title="Create your account"
      description="Join Ethio Mart to check out faster."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-burgundy hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <RegisterForm redirectTo={redirectTo} />
    </AuthCard>
  )
}
