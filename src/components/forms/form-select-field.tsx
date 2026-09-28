import type { UseFormRegisterReturn } from "react-hook-form"
import { cn } from "cn"

// A labelled native <select> with its validation message; wired the same way
// as FormField (aria-describedby + a live region for the message).
//
// Below `lg` it matches the text fields: 44px tall with 16px text (iOS zooms
// in on any field whose text is smaller). The desktop size is unchanged.
function FormSelectField({
  id,
  label,
  options,
  placeholder,
  error,
  required,
  registration,
}: {
  id: string
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  /** A choice must be made; announced to screen readers. */
  required?: boolean
  registration: UseFormRegisterReturn
}) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-charcoal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 max-lg:h-11 max-lg:rounded-xl max-lg:text-base"
        )}
        {...registration}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormSelectField }
