import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const TextareaField = ({ label, name, value, onChange, rows = 4, placeholder, validation }) => {
  const hasError = validation?.error

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={!!hasError}
        className="resize-none"
      />
      {hasError && <p className="text-xs text-destructive">{validation.error}</p>}
    </div>
  )
}
