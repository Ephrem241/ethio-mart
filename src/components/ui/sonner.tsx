"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useT } from "@/lib/i18n/provider"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const t = useT()

  return (
    <Sonner
      // The storefront has one (light) look; there is no theme switcher, so
      // there is no next-themes provider either.
      theme="light"
      className="toaster group"
      containerAriaLabel={t("common.notifications")}
      // Phones: sit above the 64px bottom navigation instead of covering it.
      mobileOffset={{ bottom: 84 }}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-forest" />
        ),
        info: (
          <InfoIcon className="size-4 text-forest" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-warning" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-error" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "var(--color-charcoal)",
          "--normal-border": "var(--border)",
          "--border-radius": "14px",
          "--width": "min(380px, calc(100vw - 32px))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-lift",
          actionButton: "!bg-forest !text-white !rounded-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
