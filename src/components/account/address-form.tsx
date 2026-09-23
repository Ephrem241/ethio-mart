"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { DELIVERY_CITIES } from "@/lib/services/delivery"
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="address-fullName"
        label="Full name"
        autoComplete="name"
        registration={register("fullName")}
        error={errors.fullName?.message}
      />
      <FormField
        id="address-phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        registration={register("phone")}
        error={errors.phone?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          id="address-city"
          label="City"
          options={DELIVERY_CITIES}
          placeholder="Select a city"
          registration={register("city")}
          error={errors.city?.message}
        />
        <FormField
          id="address-subCity"
          label="Sub-city"
          registration={register("subCity")}
          error={errors.subCity?.message}
        />
      </div>
      <FormField
        id="address-woreda"
        label="Woreda"
        registration={register("woreda")}
        error={errors.woreda?.message}
      />
      <FormField
        id="address-address"
        label="Address"
        registration={register("address")}
        error={errors.address?.message}
      />
      <div className="space-y-1.5">
        <label htmlFor="address-notes" className="text-sm font-medium text-charcoal">
          Notes <span className="text-muted-text">(optional)</span>
        </label>
        <Textarea id="address-notes" {...register("notes")} />
        {errors.notes && <p className="text-xs text-error">{errors.notes.message}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save address
        </Button>
      </div>
    </form>
  )
}

export { AddressForm }
