"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import "@/lib/i18n/zod" // translated fallbacks for zod's default messages
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { translate } from "@/lib/i18n/translate"
import { signIn } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const loginSchema = z.object({
  email: z.email({ error: () => translate("validation.email") }),
  password: z.string().min(1, { error: () => translate("auth.validation.passwordRequired") }),
})

type LoginValues = z.infer<typeof loginSchema>

function LoginForm({ redirectTo }: { redirectTo: string }) {
  const t = useT()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    const result = await signIn(values)
    if (!result.success) {
      setError("root", { message: result.error })
      return
    }
    toast.success(t("auth.login.welcome", { name: result.user.fullName.split(" ")[0] }))
    router.push(redirectTo)
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="email"
        required
        label={t("auth.fields.email")}
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormField
        id="password"
        required
        label={t("auth.fields.password")}
        type="password"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password?.message}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-error">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("auth.login.submit")}
      </Button>
    </form>
  )
}

export { LoginForm }
