import type { UseFormRegisterReturn } from "react-hook-form"
import { cn } from "cn"

function FormSelectField({
  id,
  label,
  options,
  placeholder,
  error,
  registration,
}: {
  id: string
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  registration: UseFormRegisterReturn
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        className={cn(
          "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-charcoal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
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
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

export { FormSelectField }
