import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import Link from "next/link"

import { BRAND_NAME } from "@/lib/brand"
import { getSafeRedirect } from "@/lib/safe-redirect"
import { getT } from "@/lib/i18n/server"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleButton } from "@/components/auth/google-button"
import { RegisterForm } from "@/components/auth/register-form"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("auth.register.submit"))
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const redirectTo = getSafeRedirect(params.redirect, "/account")
  const t = await getT()

  return (
    <AuthCard
      title={t("auth.register.title")}
      description={t("auth.register.description", { brand: BRAND_NAME })}
      footer={
        <p>
          {t("auth.register.haveAccount")}{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-forest underline underline-offset-4 hover:decoration-2"
          >
            {t("auth.register.login")}
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleButton redirectTo={redirectTo} label={t("auth.google.signUp")} />
        <AuthDivider />
        <RegisterForm redirectTo={redirectTo} />
      </div>
    </AuthCard>
  )
}
