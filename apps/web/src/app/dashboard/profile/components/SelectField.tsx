import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const SelectField = ({ label, name, value, onChange, options, validation }) => {
  const hasError = validation?.error

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange({ target: { name, value: v } })}>
        <SelectTrigger id={name} aria-invalid={!!hasError} className="w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && <p className="text-xs text-destructive">{validation.error}</p>}
    </div>
  )
}
