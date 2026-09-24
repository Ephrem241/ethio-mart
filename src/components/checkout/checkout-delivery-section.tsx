"use client"

import { useFormContext } from "react-hook-form"

import { useT } from "@/lib/i18n/provider"
import { deliveryCityOptions } from "@/lib/services/delivery"
import { FormField } from "@/components/forms/form-field"
import { FormSelectField } from "@/components/forms/form-select-field"
import { Textarea } from "@/components/ui/textarea"
import { CheckoutStep } from "@/components/checkout/checkout-step"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

function CheckoutDeliverySection() {
  const t = useT()
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutValues>()

  return (
    <CheckoutStep number={1} title={t("checkout.delivery.title")}>

      <FormField
        id="fullName"
        label={t("checkout.delivery.fullName")}
        autoComplete="name"
        registration={register("fullName")}
        error={errors.fullName?.message}
      />
      <FormField
        id="phone"
        label={t("checkout.delivery.phone")}
        type="tel"
        autoComplete="tel"
        registration={register("phone")}
        error={errors.phone?.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          id="city"
          label={t("checkout.delivery.city")}
          options={deliveryCityOptions(t)}
          placeholder={t("checkout.delivery.selectCity")}
          registration={register("city")}
          error={errors.city?.message}
        />
        <FormField
          id="subCity"
          label={t("checkout.delivery.subCity")}
          registration={register("subCity")}
          error={errors.subCity?.message}
        />
      </div>

      <FormField
        id="woreda"
        label={t("checkout.delivery.woreda")}
        registration={register("woreda")}
        error={errors.woreda?.message}
      />
      <FormField
        id="address"
        label={t("checkout.delivery.address")}
        registration={register("address")}
        error={errors.address?.message}
      />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-charcoal">
          {t("checkout.delivery.notes")} <span className="text-muted-text">{t("common.optionalHint")}</span>
        </label>
        <Textarea id="notes" {...register("notes")} />
        {errors.notes && <p className="text-xs text-error">{errors.notes.message}</p>}
      </div>
    </CheckoutStep>
  )
}

export { CheckoutDeliverySection }
