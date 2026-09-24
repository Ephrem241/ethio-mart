"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages

import { useT } from "@/lib/i18n/provider"
import { translate } from "@/lib/i18n/translate"
import { requestPasswordReset } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const forgotPasswordSchema = z.object({
  email: z.email({ error: () => translate("validation.email") }),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

function ForgotPasswordForm({ linkExpired = false }: { linkExpired?: boolean }) {
  const t = useT()
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await requestPasswordReset(values.email)
    if (!result.success) {
      setError("email", { message: result.error })
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <p className="text-sm text-charcoal">{t("auth.forgot.sent")}</p>
    )
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {linkExpired && (
        <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
          {t("auth.forgot.expired")}
        </p>
      )}
      <FormField
        id="email"
        label={t("auth.fields.email")}
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email?.message}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("auth.forgot.send")}
      </Button>
    </form>
  )
}

export { ForgotPasswordForm }
