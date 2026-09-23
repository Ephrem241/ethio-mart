"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { requestPasswordReset } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

function ForgotPasswordForm({ linkExpired = false }: { linkExpired?: boolean }) {
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
      <p className="text-sm text-charcoal">
        If an account exists for that email, we&apos;ve sent a link to reset your password. Check your
        inbox.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {linkExpired && (
        <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
          That reset link is invalid or has expired. Request a new one below.
        </p>
      )}
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email?.message}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Send reset link
      </Button>
    </form>
  )
}

export { ForgotPasswordForm }
