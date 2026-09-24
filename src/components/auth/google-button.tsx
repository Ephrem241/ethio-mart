"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { signInWithGoogle } from "@/lib/services/auth"
import { Button } from "@/components/ui/button"

// Google's four-colour "G" mark, per their sign-in branding guidance.
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

function GoogleButton({ redirectTo, label }: { redirectTo: string; label?: string }) {
  const t = useT()
  const [starting, setStarting] = useState(false)

  async function handleClick() {
    setStarting(true)
    const result = await signInWithGoogle(redirectTo)
    // On success the page is already navigating to Google, so the button
    // deliberately stays in its loading state; only a failure re-enables it.
    if (!result.success) {
      toast.error(result.error)
      setStarting(false)
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full gap-2" disabled={starting} onClick={handleClick}>
      <GoogleMark />
      {starting ? t("auth.google.redirecting") : (label ?? t("auth.google.continue"))}
    </Button>
  )
}

export { GoogleButton }
