"use client"

import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useHomepageSettings } from "@/lib/hooks/use-admin-data"
import { updateHomepageSettings } from "@/lib/services/admin-homepage"
import type { HomepageSettings } from "@/lib/services/homepage"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

function AdminHomepageContent() {
  const { data: settings, loading, error, reload } = useHomepageSettings()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<HomepageSettings>({ values: settings })

  if (loading) return null

  if (error || !settings) {
    return <p className="text-sm text-error">We couldn&apos;t load the homepage settings. Please refresh the page.</p>
  }

  async function onSubmit(values: HomepageSettings) {
    const result = await updateHomepageSettings(values)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Homepage updated.")
    reload()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-card border border-border bg-card p-5">
        <h2 className="font-medium text-charcoal">Hero banner</h2>
        <FormField id="heroHeadline" label="Headline" registration={register("heroHeadline")} />
        <FormField id="heroSubtext" label="Subtext" registration={register("heroSubtext")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="heroCtaLabel" label="Primary button label" registration={register("heroCtaLabel")} />
          <FormField id="heroCtaHref" label="Primary button link" registration={register("heroCtaHref")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="heroSecondaryCtaLabel"
            label="Secondary button label"
            registration={register("heroSecondaryCtaLabel")}
          />
          <FormField
            id="heroSecondaryCtaHref"
            label="Secondary button link"
            registration={register("heroSecondaryCtaHref")}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-card border border-border bg-card p-5">
        <h2 className="font-medium text-charcoal">Promotional banner</h2>
        <FormField id="promoEyebrow" label="Eyebrow text" registration={register("promoEyebrow")} />
        <FormField id="promoHeadline" label="Headline" registration={register("promoHeadline")} />
        <FormField id="promoSubtext" label="Subtext" registration={register("promoSubtext")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="promoCtaLabel" label="Button label" registration={register("promoCtaLabel")} />
          <FormField id="promoCtaHref" label="Button link" registration={register("promoCtaHref")} />
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        Save changes
      </Button>
    </form>
  )
}

export { AdminHomepageContent }
