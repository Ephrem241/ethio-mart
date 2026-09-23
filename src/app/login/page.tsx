import Link from "next/link"

import { getSafeRedirect } from "@/lib/safe-redirect"
import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const redirectTo = getSafeRedirect(params.redirect, "/account")

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your account."
      footer={
        <>
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-burgundy hover:underline"
            >
              Create one
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-burgundy hover:underline">
              Forgot your password?
            </Link>
          </p>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  )
}
