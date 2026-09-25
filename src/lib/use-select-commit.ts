import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"

// A native <select> fires `change` on every arrow-key press. A select that ACTS
// on change (reloads the list, saves an order status) therefore makes it
// impossible to browse its options from the keyboard: the first arrow press
// already applies the first option (WCAG 3.2.2, On Input). For an order status
// that can mean an irreversible "cancelled" or "delivered" on the way past.
//
// This holds keyboard browsing back until the choice is confirmed — Enter, or
// leaving the field — while a pick made with the mouse or touch, or from the
// open list, applies straight away as before. Spread the result on the <select>.
export function useSelectCommit(value: string, onCommit: (next: string) => void) {
  // A choice made by arrowing through the options, not applied yet.
  const [pending, setPending] = useState<string | null>(null)
  // Set by a key press, read by the `change` it causes.
  const viaKeyboard = useRef(false)

  function commit(next: string) {
    setPending(null)
    if (next !== value) onCommit(next)
  }

  return {
    value: pending ?? value,
    onPointerDown: () => {
      viaKeyboard.current = false
    },
    onKeyDown: (e: KeyboardEvent<HTMLSelectElement>) => {
      if (e.key === "Enter") {
        if (pending !== null) {
          e.preventDefault()
          commit(pending)
        }
      } else if (!["Tab", "Escape", "Shift", "Control", "Alt", "Meta"].includes(e.key)) {
        viaKeyboard.current = true
      }
    },
    onChange: (e: ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value
      if (viaKeyboard.current) {
        viaKeyboard.current = false
        setPending(next)
      } else {
        commit(next)
      }
    },
    onBlur: () => {
      if (pending !== null) commit(pending)
    },
  }
}
