"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { changePassword } from "@/lib/services/auth"
import { changePasswordSchema, type ChangePasswordValues } from "@/components/account/change-password-schema"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

function ChangePasswordForm({ userId }: { userId: string }) {
  const t = useT()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(values: ChangePasswordValues) {
    const result = await changePassword({ userId, ...values })
    if (!result.success) {
      setError("currentPassword", { message: result.error })
      return
    }
    toast.success(t("auth.reset.updated"))
    reset()
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="currentPassword"
        required
        label={t("account.settings.currentPassword")}
        type="password"
        autoComplete="current-password"
        registration={register("currentPassword")}
        error={errors.currentPassword?.message}
      />
      <FormField
        id="newPassword"
        required
        label={t("auth.fields.newPassword")}
        type="password"
        autoComplete="new-password"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {t("auth.reset.update")}
      </Button>
    </form>
  )
}

export { ChangePasswordForm }
