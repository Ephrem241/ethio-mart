"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import type { AuthUser } from "@/lib/store/auth"
import { updateProfile } from "@/lib/services/auth"
import { profileSchema, type ProfileValues } from "@/components/account/profile-schema"
import { FormField } from "@/components/forms/form-field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function ProfileForm({ user }: { user: AuthUser }) {
  const t = useT()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user.fullName, phone: user.phone ?? "" },
  })

  async function onSubmit(values: ProfileValues) {
    const result = await updateProfile({ userId: user.id, ...values })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(t("account.profile.updated"))
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="fullName"
        label={t("account.profile.fullName")}
        autoComplete="name"
        registration={register("fullName")}
        error={errors.fullName?.message}
      />
      <FormField
        id="phone"
        label={t("account.profile.phone")}
        type="tel"
        autoComplete="tel"
        registration={register("phone")}
        error={errors.phone?.message}
      />
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-charcoal">
          {t("account.profile.email")}
        </label>
        <Input id="email" type="email" value={user.email} disabled />
        <p className="text-xs text-muted-text">{t("account.profile.emailHint")}</p>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {t("account.profile.save")}
      </Button>
    </form>
  )
}

export { ProfileForm }
