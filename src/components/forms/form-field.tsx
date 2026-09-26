import type { UseFormRegisterReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// A labelled text input with its validation message. The message is wired to
// the input (aria-describedby, so a screen reader reads it when the field is
// focused) and is a live region of its own (role="alert", so it is also read
// out the moment it appears or changes, even when focus is elsewhere).
function FormField({
  id,
  label,
  type = "text",
  autoComplete,
  error,
  required,
  multiline,
  registration,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  error?: string
  /** The field must be filled in; announced to screen readers. */
  required?: boolean
  /** Two lines instead of one, for text where a line break is meaningful (a single-line input would silently drop it). */
  multiline?: boolean
  registration: UseFormRegisterReturn
}) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      {multiline ? (
        <Textarea
          id={id}
          rows={2}
          className="min-h-0"
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-required={required || undefined}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
      ) : (
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-required={required || undefined}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
