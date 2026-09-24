"use client"

import { CheckoutSkeleton } from "@/components/feedback/skeletons"
import { useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useCartStore } from "@/lib/store/cart"
import { placeOrder } from "@/lib/services/checkout"
import { checkoutSchema, type CheckoutValues } from "@/components/checkout/checkout-schema"
import { CheckoutDeliverySection } from "@/components/checkout/checkout-delivery-section"
import { CheckoutPaymentSection } from "@/components/checkout/checkout-payment-section"
import { CheckoutReviewSection } from "@/components/checkout/checkout-review-section"

function CheckoutContent() {
  const { user, ready } = useRequireAuth("/login?redirect=/checkout")
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const cartHasHydrated = useCartStore((s) => s.hasHydrated)
  const [submitError, setSubmitError] = useState<string | undefined>()

  const methods = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod" },
  })
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods

  // An empty cart has nothing to check out — send the user back rather than
  // rendering a delivery/payment form for zero items.
  useEffect(() => {
    if (ready && cartHasHydrated && items.length === 0) {
      router.replace("/cart")
    }
  }, [ready, cartHasHydrated, items.length, router])

  if (!ready || !user) return <CheckoutSkeleton />
  if (!cartHasHydrated || items.length === 0) return <CheckoutSkeleton />

  async function onSubmit(values: CheckoutValues) {
    setSubmitError(undefined)
    const result = await placeOrder({
      deliveryAddress: {
        full_name: values.fullName,
        phone: values.phone,
        city: values.city,
        sub_city: values.subCity,
        woreda: values.woreda,
        address: values.address,
        notes: values.notes || undefined,
      },
      paymentMethod: values.paymentMethod as "cod" | "manual",
    })

    if (!result.success) {
      setSubmitError(result.error)
      return
    }

    router.push(`/order/success/${result.order.id}`)
  }

  return (
    <FormProvider {...methods}>
      <form
        method="post"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start"
      >
        <div className="space-y-6">
          <CheckoutDeliverySection />
          <CheckoutPaymentSection />
        </div>
        <div className="lg:sticky lg:top-32">
          <CheckoutReviewSection submitError={submitError} isSubmitting={isSubmitting} />
        </div>
      </form>
    </FormProvider>
  )
}

export { CheckoutContent }
