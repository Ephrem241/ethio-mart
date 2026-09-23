import Link from "next/link"

import { getSafeRedirect } from "@/lib/safe-redirect"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleButton } from "@/components/auth/google-button"
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
      <div className="space-y-4">
        {params.error === "oauth" && (
          <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
            Google sign-in didn&apos;t complete. Please try again, or log in with your email.
          </p>
        )}
        <GoogleButton redirectTo={redirectTo} />
        <AuthDivider />
        <LoginForm redirectTo={redirectTo} />
      </div>
    </AuthCard>
  )
}
