"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { signIn } from "@/lib/services/auth"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
})

type LoginValues = z.infer<typeof loginSchema>

function LoginForm({ redirectTo }: { redirectTo: string }) {
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
    toast.success(`Welcome back, ${result.user.fullName.split(" ")[0]}.`)
    router.push(redirectTo)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password?.message}
      />
      {errors.root && <p className="text-sm text-error">{errors.root.message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Log in
      </Button>
    </form>
  )
}

export { LoginForm }
