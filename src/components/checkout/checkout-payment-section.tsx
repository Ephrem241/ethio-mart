"use client"

import { useFormContext } from "react-hook-form"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { paymentProviders } from "@/lib/services/payment"
import { CheckoutStep } from "@/components/checkout/checkout-step"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

function CheckoutPaymentSection() {
  const t = useT()
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutValues>()

  return (
    <CheckoutStep number={2} title={t("checkout.payment.title")}>
      <div className="space-y-2.5">
        {paymentProviders.map((provider) => (
          <label
            key={provider.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border p-4 text-sm transition-colors has-[:checked]:border-forest has-[:checked]:bg-cream",
              provider.enabled ? "cursor-pointer hover:border-forest/50" : "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="radio"
              value={provider.id}
              disabled={!provider.enabled}
              className="mt-0.5 accent-forest"
              {...register("paymentMethod")}
            />
            <span>
              <span className="block font-medium text-charcoal">{t(provider.label)}</span>
              {provider.description && (
                <span className="block text-muted-text">{t(provider.description)}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {errors.paymentMethod && (
        <p className="text-xs text-error">{errors.paymentMethod.message}</p>
      )}
    </CheckoutStep>
  )
}

export { CheckoutPaymentSection }
