"use client"

import { useCallback, useEffect, useState } from "react"

export interface Remote<T> {
  data: T | undefined
  // True only until the first result for the CURRENT key arrives. A reload
  // keeps showing the previous data instead of blanking the page.
  loading: boolean
  error: string | undefined
  reload: () => void
}

// One small fetch-on-mount hook shared by the order hooks below. `key`
// identifies what is being loaded (an order id, a user id, ...); `null`
// means "nothing to load yet" (e.g. the user isn't resolved). `load` must be
// a stable module-level function. State is only ever set inside the promise
// callbacks, never synchronously in the effect body.
export function useRemote<T>(key: string | null, load: (key: string) => Promise<T>): Remote<T> {
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null)

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    load(key)
      .then((data) => {
        if (!cancelled) setResult({ key, data })
      })
      .catch((error: Error) => {
        console.error(error)
        if (!cancelled) setResult({ key, error: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [key, load, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const current = result && result.key === key ? result : null

  return {
    data: current?.data,
    loading: key !== null && current === null,
    error: current?.error,
    reload,
  }
}
