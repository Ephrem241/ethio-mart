"use client"

import { FormSkeleton } from "@/components/feedback/skeletons"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { useHomepageSettings } from "@/lib/hooks/use-admin-data"
import { updateHomepageSettings } from "@/lib/services/admin-homepage"
import type { HomepageSettings } from "@/lib/services/homepage"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"

// The placeholder an admin types into the deals headline (see fillDealTokens),
// and a private marker used to find where it belongs inside the translated hint.
const PROMO_TOKEN = "{maxDiscount}"
const TOKEN_MARK = "\u0001"

// The end date is stored as an ISO timestamp (an absolute moment), but an
// <input type="datetime-local"> speaks "YYYY-MM-DDTHH:mm" in the admin's own
// time zone. These convert between the two; an empty value means "no end date".
function toLocalInput(iso: string): string {
  const date = iso ? new Date(iso) : null
  if (!date || Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(local: string): string {
  const date = local ? new Date(local) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : ""
}

function AdminHomepageContent() {
  const t = useT()
  const { data: settings, loading, error, reload } = useHomepageSettings()

  const formValues = useMemo(
    () => (settings ? { ...settings, promoEndsAt: toLocalInput(settings.promoEndsAt) } : undefined),
    [settings]
  )
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<HomepageSettings>({ values: formValues })

  if (loading) return <FormSkeleton fields={6} />

  if (error || !settings) {
    return <p className="text-sm text-error">{t("admin.loadFailed.homepage")}</p>
  }

  async function onSubmit(values: HomepageSettings) {
    const result = await updateHomepageSettings({ ...values, promoEndsAt: fromLocalInput(values.promoEndsAt) })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(t("admin.homepage.saved"))
    reload()
  }

  const en = (label: string) => t("admin.homepage.english", { label })
  const am = (label: string) => t("admin.homepage.amharic", { label })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-8">
      <p className="text-sm text-muted-text">{t("admin.homepage.hint")}</p>

      <section className="space-y-4 rounded-card border border-border bg-card p-5">
        <h2 className="font-medium text-charcoal">{t("admin.homepage.hero")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="heroHeadline" label={en(t("admin.homepage.headline"))} registration={register("heroHeadline")} />
          <FormField id="heroHeadlineAm" label={am(t("admin.homepage.headline"))} registration={register("heroHeadlineAm")} />
          <FormField id="heroSubtext" label={en(t("admin.homepage.subtext"))} registration={register("heroSubtext")} />
          <FormField id="heroSubtextAm" label={am(t("admin.homepage.subtext"))} registration={register("heroSubtextAm")} />
          <FormField id="heroCtaLabel" label={en(t("admin.homepage.primaryLabel"))} registration={register("heroCtaLabel")} />
          <FormField id="heroCtaLabelAm" label={am(t("admin.homepage.primaryLabel"))} registration={register("heroCtaLabelAm")} />
          <FormField
            id="heroSecondaryCtaLabel"
            label={en(t("admin.homepage.secondaryLabel"))}
            registration={register("heroSecondaryCtaLabel")}
          />
          <FormField
            id="heroSecondaryCtaLabelAm"
            label={am(t("admin.homepage.secondaryLabel"))}
            registration={register("heroSecondaryCtaLabelAm")}
          />
          <FormField id="heroCtaHref" label={t("admin.homepage.primaryLink")} registration={register("heroCtaHref")} />
          <FormField
            id="heroSecondaryCtaHref"
            label={t("admin.homepage.secondaryLink")}
            registration={register("heroSecondaryCtaHref")}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-card border border-border bg-card p-5">
        <h2 className="font-medium text-charcoal">{t("admin.homepage.promo")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="promoEyebrow" label={en(t("admin.homepage.eyebrow"))} registration={register("promoEyebrow")} />
          <FormField id="promoEyebrowAm" label={am(t("admin.homepage.eyebrow"))} registration={register("promoEyebrowAm")} />
          <FormField id="promoHeadline" label={en(t("admin.homepage.headline"))} registration={register("promoHeadline")} />
          <FormField id="promoHeadlineAm" label={am(t("admin.homepage.headline"))} registration={register("promoHeadlineAm")} />
          <FormField id="promoSubtext" label={en(t("admin.homepage.subtext"))} registration={register("promoSubtext")} />
          <FormField id="promoSubtextAm" label={am(t("admin.homepage.subtext"))} registration={register("promoSubtextAm")} />
          <FormField id="promoCtaLabel" label={en(t("admin.homepage.buttonLabel"))} registration={register("promoCtaLabel")} />
          <FormField id="promoCtaLabelAm" label={am(t("admin.homepage.buttonLabel"))} registration={register("promoCtaLabelAm")} />
          <FormField id="promoCtaHref" label={t("admin.homepage.buttonLink")} registration={register("promoCtaHref")} />
          <FormField
            id="promoEndsAt"
            type="datetime-local"
            label={t("admin.homepage.endsAt")}
            registration={register("promoEndsAt")}
          />
        </div>
        <p className="text-xs leading-relaxed text-muted-text">{t("admin.homepage.endsAtHint")}</p>
        <p className="text-xs leading-relaxed text-muted-text">
          {/* The placeholder itself must be typed exactly, in Latin letters, so
              it is shown as a code chip inside the (translated) sentence. */}
          {t("admin.homepage.promoHint", { token: TOKEN_MARK })
            .split(TOKEN_MARK)
            .flatMap((part, i) => [
              i > 0 ? (
                <code key={`token-${i}`} lang="en" className="rounded bg-cream px-1 py-0.5 font-mono text-[11px] text-charcoal">
                  {PROMO_TOKEN}
                </code>
              ) : null,
              part,
            ])}
        </p>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {t("admin.homepage.save")}
      </Button>
    </form>
  )
}

export { AdminHomepageContent }
