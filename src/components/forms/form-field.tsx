import type { UseFormRegisterReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"

function FormField({
  id,
  label,
  type = "text",
  autoComplete,
  error,
  registration,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  error?: string
  registration: UseFormRegisterReturn
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        {...registration}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

export { FormField }
