"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setNewPassword } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Use at least 8 characters."),
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
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
      // Opening this page directly (no emailed link) means there is no
      // recovery session, which the auth server reports as a missing session.
      const message = /session/i.test(result.error)
        ? "This reset link is invalid or has expired. Request a new one."
        : result.error
      setError("newPassword", { message })
      return
    }
    toast.success("Password updated.")
    router.push("/account")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Update password
      </Button>
    </form>
  )
}

export { ResetPasswordForm }
