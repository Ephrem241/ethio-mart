// Remembers which items the shopper changed on THIS device since the server's
// copy was last reconciled with it.
//
// A signed-in shopper's cart and favorites are written through to the server,
// but the server's answer can be stale compared with the screen: an edit made
// before the session is known sends nothing, and an edit made while the server
// copy is still loading lands after the snapshot was read. When the snapshot
// arrives, services/guest-sync.ts merges these edits over it — what the
// shopper just did wins, everything else comes from the server — instead of
// letting the snapshot silently undo their tap.
export interface EditTracker {
  record: (id: string) => void
  /** Everything was changed at once (the cart was emptied). */
  recordAll: () => void
  /** What was edited since the last drain, then forgotten. */
  drain: () => { ids: Set<string>; all: boolean }
}

export function createEditTracker(): EditTracker {
  let ids = new Set<string>()
  let all = false

  return {
    record: (id) => {
      ids.add(id)
    },
    recordAll: () => {
      all = true
    },
    drain: () => {
      const edits = { ids, all }
      ids = new Set()
      all = false
      return edits
    },
  }
}
