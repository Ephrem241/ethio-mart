import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import Link from "next/link"

import { getSafeRedirect } from "@/lib/safe-redirect"
import { getT } from "@/lib/i18n/server"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleButton } from "@/components/auth/google-button"
import { LoginForm } from "@/components/auth/login-form"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("auth.login.submit"))
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const redirectTo = getSafeRedirect(params.redirect, "/account")
  const t = await getT()

  return (
    <AuthCard
      title={t("auth.login.title")}
      description={t("auth.login.description")}
      footer={
        <>
          <p>
            {t("auth.login.noAccount")}{" "}
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-forest underline underline-offset-4 hover:decoration-2"
            >
              {t("auth.login.create")}
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-forest underline underline-offset-4 hover:decoration-2">
              {t("auth.login.forgot")}
            </Link>
          </p>
        </>
      }
    >
      <div className="space-y-4">
        {params.error === "oauth" && (
          <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning-text">
            {t("auth.login.oauthFailed")}
          </p>
        )}
        <GoogleButton redirectTo={redirectTo} />
        <AuthDivider />
        <LoginForm redirectTo={redirectTo} />
      </div>
    </AuthCard>
  )
}
