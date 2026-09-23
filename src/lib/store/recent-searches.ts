import { create } from "zustand"
import { persist } from "zustand/middleware"

interface RecentSearchesState {
  queries: string[]
  add: (query: string) => void
}

const MAX_RECENT = 5

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) =>
        set((state) => {
          const trimmed = query.trim()
          if (!trimmed) return state
          const deduped = state.queries.filter(
            (q) => q.toLowerCase() !== trimmed.toLowerCase()
          )
          return { queries: [trimmed, ...deduped].slice(0, MAX_RECENT) }
        }),
    }),
    { name: "ethio-mart-recent-searches" }
  )
)
