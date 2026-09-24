"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useT } from "@/lib/i18n/provider"
import { deliveryCityOptions } from "@/lib/services/delivery"
import { addressSchema, type AddressValues } from "@/components/account/address-schema"
import { FormField } from "@/components/forms/form-field"
import { FormSelectField } from "@/components/forms/form-select-field"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

function AddressForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues?: AddressValues
  onSubmit: (values: AddressValues) => void
  onCancel: () => void
}) {
  const t = useT()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues,
  })

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="address-fullName"
        label={t("checkout.delivery.fullName")}
        autoComplete="name"
        registration={register("fullName")}
        error={errors.fullName?.message}
      />
      <FormField
        id="address-phone"
        label={t("checkout.delivery.phone")}
        type="tel"
        autoComplete="tel"
        registration={register("phone")}
        error={errors.phone?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          id="address-city"
          label={t("checkout.delivery.city")}
          options={deliveryCityOptions(t)}
          placeholder={t("checkout.delivery.selectCity")}
          registration={register("city")}
          error={errors.city?.message}
        />
        <FormField
          id="address-subCity"
          label={t("checkout.delivery.subCity")}
          registration={register("subCity")}
          error={errors.subCity?.message}
        />
      </div>
      <FormField
        id="address-woreda"
        label={t("checkout.delivery.woreda")}
        registration={register("woreda")}
        error={errors.woreda?.message}
      />
      <FormField
        id="address-address"
        label={t("checkout.delivery.address")}
        registration={register("address")}
        error={errors.address?.message}
      />
      <div className="space-y-1.5">
        <label htmlFor="address-notes" className="text-sm font-medium text-charcoal">
          {t("account.addresses.formNotes")} <span className="text-muted-text">{t("common.optionalHint")}</span>
        </label>
        <Textarea id="address-notes" {...register("notes")} />
        {errors.notes && <p className="text-xs text-error">{errors.notes.message}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {t("account.addresses.save")}
        </Button>
      </div>
    </form>
  )
}

export { AddressForm }
