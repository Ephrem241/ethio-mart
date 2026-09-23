"use client"

import { useEffect, useMemo, useState } from "react"

import { fetchProductsByIds } from "@/lib/services/catalog-client"
import type { ProductWithCategory } from "@/lib/services/catalog"

interface Loaded {
  requested: string[]
  products: ProductWithCategory[]
}

interface Result {
  products: ProductWithCategory[]
  loading: boolean
}

const EMPTY: Result = { products: [], loading: false }
const LOADING: Result = { products: [], loading: true }

// Resolves a set of product ids to live products (cart lines, favorites).
// `loading` is true only until the ids in play have been looked up at least
// once, so callers don't flash an "unavailable" state for items that simply
// haven't been fetched yet. Removing an id is answered from what's already
// loaded (no refetch, no blank flash); only a genuinely new id triggers one.
export function useProductsByIds(ids: string[]): Result {
  // Order-insensitive, so re-ordering a cart doesn't trigger a refetch.
  const key = useMemo(() => [...new Set(ids)].sort().join(","), [ids])
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  const covered = key !== "" && !!loaded && key.split(",").every((id) => loaded.requested.includes(id))

  useEffect(() => {
    if (key === "" || covered) return
    let cancelled = false
    const requested = key.split(",")
    fetchProductsByIds(requested)
      .then((products) => {
        if (!cancelled) setLoaded({ requested, products })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setLoaded({ requested, products: [] })
      })
    return () => {
      cancelled = true
    }
  }, [key, covered])

  return useMemo(() => {
    if (key === "") return EMPTY
    if (!loaded || !covered) return LOADING
    const wanted = new Set(key.split(","))
    return { products: loaded.products.filter((p) => wanted.has(p.id)), loading: false }
  }, [key, loaded, covered])
}
