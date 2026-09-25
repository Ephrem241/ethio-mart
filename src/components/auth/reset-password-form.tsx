"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { translate } from "@/lib/i18n/translate"
import { setNewPassword } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { error: () => translate("auth.validation.passwordMin") }),
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const t = useT()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values: ResetPasswordValues) {
    const result = await setNewPassword(values.newPassword)
    if (!result.success) {
      setError("newPassword", { message: result.error })
      return
    }
    toast.success(t("auth.reset.updated"))
    router.push("/account")
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="newPassword"
        required
        label={t("auth.fields.newPassword")}
        type="password"
        autoComplete="new-password"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("auth.reset.update")}
      </Button>
    </form>
  )
}

export { ResetPasswordForm }
