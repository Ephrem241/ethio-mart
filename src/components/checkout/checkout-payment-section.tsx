"use client"

import { useFormContext } from "react-hook-form"
import { cn } from "cn"

import { paymentProviders } from "@/lib/services/payment"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

function CheckoutPaymentSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutValues>()

  return (
    <section className="space-y-4 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">Payment method</h2>

      <div className="space-y-2">
        {paymentProviders.map((provider) => (
          <label
            key={provider.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-3 text-sm",
              provider.enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="radio"
              value={provider.id}
              disabled={!provider.enabled}
              className="mt-0.5 accent-burgundy"
              {...register("paymentMethod")}
            />
            <span>
              <span className="block font-medium text-charcoal">{provider.label}</span>
              {provider.description && (
                <span className="block text-muted-text">{provider.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {errors.paymentMethod && (
        <p className="text-xs text-error">{errors.paymentMethod.message}</p>
      )}
    </section>
  )
}

export { CheckoutPaymentSection }
