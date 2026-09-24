import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import Link from "next/link"

import { getT } from "@/lib/i18n/server"
import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("auth.forgot.title"))
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const t = await getT()

  return (
    <AuthCard
      title={t("auth.forgot.title")}
      description={t("auth.forgot.description")}
      footer={
        <p>
          {t("auth.forgot.remembered")}{" "}
          <Link href="/login" className="text-forest hover:underline">
            {t("auth.forgot.login")}
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm linkExpired={params.error === "expired"} />
    </AuthCard>
  )
}
