"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { subscribeToNewsletter } from "@/lib/services/newsletter"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const newsletterSchema = z.object({
  email: z.email("Enter a valid email address."),
})

type NewsletterValues = z.infer<typeof newsletterSchema>

function Newsletter() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({ resolver: zodResolver(newsletterSchema) })

  async function onSubmit(values: NewsletterValues) {
    const result = await subscribeToNewsletter(values.email)
    if (result.success) {
      toast.success("You're subscribed! Thanks for joining us.")
      reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <section className="rounded-card border border-border bg-card px-6 py-10 text-center sm:px-10">
      <h2 className="text-2xl font-semibold text-charcoal">Stay in the loop</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-text">
        Get updates on new arrivals and special offers. No spam, unsubscribe anytime.
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row sm:items-start"
      >
        <div className="flex-1 text-left">
          <Input
            type="email"
            placeholder="you@example.com"
            aria-label="Email address"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Subscribe
        </Button>
      </form>
    </section>
  )
}

export { Newsletter }
