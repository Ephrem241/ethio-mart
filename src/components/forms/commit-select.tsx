"use client"

import * as React from "react"

import { useSelectCommit } from "@/lib/use-select-commit"

// A native <select> that acts on the choice (`onCommit`) without making its
// options impossible to browse by keyboard: arrow keys move through them and
// Enter (or leaving the field) applies the one you stopped on. Mouse and touch
// picks apply immediately. See lib/use-select-commit.ts for the why.
function CommitSelect({
  value,
  onCommit,
  ...props
}: Omit<React.ComponentProps<"select">, "value" | "onChange"> & {
  value: string
  onCommit: (next: string) => void
}) {
  const commitProps = useSelectCommit(value, onCommit)
  return <select {...props} {...commitProps} />
}

export { CommitSelect }
