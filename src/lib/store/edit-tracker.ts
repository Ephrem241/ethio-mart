import type { Edits } from "@/lib/reconcile"

// Remembers which items the shopper changed on THIS device that the server has
// not confirmed yet.
//
// A signed-in shopper's cart and favorites are written through to the server,
// but the server's copy can lag behind the screen: an edit made before the
// session is known sends nothing, an edit made while the server copy is still
// loading lands after the snapshot was read, and a page that is reloaded or
// closed mid-save never delivers its request at all. When the server's copy is
// next loaded, services/guest-sync.ts lays these edits over it — what the
// shopper did here wins, everything else comes from the server — instead of
// treating the server's silence as "the shopper removed it".
//
// Two lists are kept, because two different things can go wrong:
//  - What was edited on THIS page since the server's copy was last read (the
//    "recent" list, in memory). A snapshot read before a save landed can arrive
//    after it, and would undo the tap, so these are handed over — once — to
//    the next merge even when their saves have been confirmed.
//  - What the server has not confirmed (the "unconfirmed" list, in
//    localStorage). It outlives the page, so an edit whose save never arrived
//    (reload, closed tab, offline) is still merged in by the next page. An
//    edit leaves this list only when the server confirms it (`settle`).
//
// Each unconfirmed edit carries a version. A write that finishes forgets its
// edit only if the shopper has not changed the same item again since, so a slow
// first save can never make the tracker forget a newer change.

/** The part of `Storage` the tracker needs (so tests can supply their own). */
export type TrackerStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

/** Called once the server has confirmed an edit; does nothing if that item was edited again since. */
export type Settle = () => void

export interface PendingEdits {
  edits: Edits
  /** Forget an item's edit — unless it was edited again after this list was taken. */
  settle: (id: string) => void
  /** Forget "everything was changed" — unless it happened again after this list was taken. */
  settleAll: () => void
}

export interface EditTracker {
  /** Note that `id` was changed here. The result confirms the change reached the server. */
  record: (id: string) => Settle
  /** Everything was changed at once (the cart was emptied). */
  recordAll: () => Settle
  /**
   * Everything to merge over a server snapshot: this page's edits since the last
   * call (handed over once) plus every edit the server has not confirmed yet,
   * including those a page that has since closed left behind (kept until confirmed).
   */
  pending: () => PendingEdits
  /** Forget everything (signing out, or a different account signing in). */
  clear: () => void
}

interface Saved {
  ids: Record<string, number>
  all: number
  seq: number
}

const EMPTY: Saved = { ids: {}, all: 0, seq: 0 }

function read(storage: TrackerStorage | undefined, key: string): Saved {
  if (!storage) return EMPTY
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "null")
    if (typeof parsed !== "object" || parsed === null) return EMPTY
    const { ids, all, seq } = parsed as Partial<Record<keyof Saved, unknown>>
    const versions: Record<string, number> = {}
    if (typeof ids === "object" && ids !== null) {
      for (const [id, version] of Object.entries(ids)) {
        if (typeof version === "number") versions[id] = version
      }
    }
    return {
      ids: versions,
      all: typeof all === "number" ? all : 0,
      seq: typeof seq === "number" ? seq : 0,
    }
  } catch {
    return EMPTY // unreadable or corrupt: start from nothing
  }
}

export function createEditTracker(storage?: TrackerStorage, key = "edit-tracker"): EditTracker {
  const saved = read(storage, key)
  // Unconfirmed edits (persisted).
  const versions = new Map<string, number>(Object.entries(saved.ids))
  let allVersion = saved.all
  let seq = saved.seq
  // Edits made on this page since the last merge (memory only).
  let recent = new Set<string>()
  let recentAll = false

  function save() {
    if (!storage) return
    try {
      if (versions.size === 0 && allVersion === 0) storage.removeItem(key)
      else storage.setItem(key, JSON.stringify({ ids: Object.fromEntries(versions), all: allVersion, seq }))
    } catch {
      // Storage unavailable or full: the edits then only last until the page closes.
    }
  }

  return {
    record: (id) => {
      const version = ++seq
      recent.add(id)
      versions.set(id, version)
      save()
      return () => {
        if (versions.get(id) !== version) return
        versions.delete(id)
        save()
      }
    },
    recordAll: () => {
      const version = ++seq
      recentAll = true
      allVersion = version
      save()
      return () => {
        if (allVersion !== version) return
        allVersion = 0
        save()
      }
    },
    pending: () => {
      const taken = new Map(versions)
      const takenAll = allVersion
      const edits = { ids: new Set([...recent, ...taken.keys()]), all: recentAll || takenAll !== 0 }
      recent = new Set()
      recentAll = false
      return {
        edits,
        settle: (id) => {
          const version = taken.get(id)
          if (version === undefined || versions.get(id) !== version) return
          versions.delete(id)
          save()
        },
        settleAll: () => {
          if (takenAll === 0 || allVersion !== takenAll) return
          allVersion = 0
          save()
        },
      }
    },
    clear: () => {
      versions.clear()
      allVersion = 0
      recent = new Set()
      recentAll = false
      save()
    },
  }
}

/** localStorage when the browser has it (not on the server, and not when access is blocked). */
export function browserStorage(): TrackerStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage
  } catch {
    return undefined
  }
}
