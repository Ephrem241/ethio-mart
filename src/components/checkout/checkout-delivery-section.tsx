"use client"

import { useFormContext } from "react-hook-form"

import { DELIVERY_CITIES } from "@/lib/services/delivery"
import { FormField } from "@/components/forms/form-field"
import { FormSelectField } from "@/components/forms/form-select-field"
import { Textarea } from "@/components/ui/textarea"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

function CheckoutDeliverySection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutValues>()

  return (
    <section className="space-y-4 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">Delivery information</h2>

      <FormField
        id="fullName"
        label="Full name"
        autoComplete="name"
        registration={register("fullName")}
        error={errors.fullName?.message}
      />
      <FormField
        id="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        registration={register("phone")}
        error={errors.phone?.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          id="city"
          label="City"
          options={DELIVERY_CITIES}
          placeholder="Select a city"
          registration={register("city")}
          error={errors.city?.message}
        />
        <FormField
          id="subCity"
          label="Sub-city"
          registration={register("subCity")}
          error={errors.subCity?.message}
        />
      </div>

      <FormField
        id="woreda"
        label="Woreda"
        registration={register("woreda")}
        error={errors.woreda?.message}
      />
      <FormField
        id="address"
        label="Address"
        registration={register("address")}
        error={errors.address?.message}
      />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-charcoal">
          Delivery notes <span className="text-muted-text">(optional)</span>
        </label>
        <Textarea id="notes" {...register("notes")} />
        {errors.notes && <p className="text-xs text-error">{errors.notes.message}</p>}
      </div>
    </section>
  )
}

export { CheckoutDeliverySection }
