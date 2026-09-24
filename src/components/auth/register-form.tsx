"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { translate } from "@/lib/i18n/translate"
import { signUp } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const registerSchema = z.object({
  fullName: z.string().trim().min(2, { error: () => translate("auth.validation.fullName") }),
  email: z.email({ error: () => translate("validation.email") }),
  password: z.string().min(8, { error: () => translate("auth.validation.passwordMin") }),
})

type RegisterValues = z.infer<typeof registerSchema>

function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const t = useT()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterValues) {
    const result = await signUp(values)
    if (!result.success) {
      setError("email", { message: result.error })
      return
    }
    toast.success(t("auth.register.created"))
    router.push(redirectTo)
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="fullName"
        label={t("auth.fields.fullName")}
        autoComplete="name"
        registration={register("fullName")}
        error={errors.fullName?.message}
      />
      <FormField
        id="email"
        label={t("auth.fields.email")}
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormField
        id="password"
        label={t("auth.fields.password")}
        type="password"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password?.message}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("auth.register.submit")}
      </Button>
    </form>
  )
}

export { RegisterForm }
