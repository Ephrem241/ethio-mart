import type { Metadata } from "next"

import { privateMetadata } from "@/lib/seo/metadata"
import Link from "next/link"

import { getT } from "@/lib/i18n/server"
import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

// Not for search results: it belongs to one visitor (see privateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return privateMetadata(t("auth.reset.title"))
}

export default async function ResetPasswordPage() {
  const t = await getT()

  return (
    <AuthCard
      title={t("auth.reset.title")}
      footer={
        <p>
          {t("auth.reset.linkNotWorking")}{" "}
          <Link href="/forgot-password" className="text-forest underline underline-offset-4 hover:decoration-2">
            {t("auth.reset.requestNew")}
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  )
}
