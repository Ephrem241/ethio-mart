"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { changePassword } from "@/lib/services/auth"
import { changePasswordSchema, type ChangePasswordValues } from "@/components/account/change-password-schema"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

function ChangePasswordForm({ userId }: { userId: string }) {
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
    toast.success("Password updated.")
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        registration={register("currentPassword")}
        error={errors.currentPassword?.message}
      />
      <FormField
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        Update password
      </Button>
    </form>
  )
}

export { ChangePasswordForm }
