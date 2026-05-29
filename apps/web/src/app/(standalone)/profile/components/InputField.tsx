import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const InputField = ({ label, name, value, onChange, type = 'text', placeholder, readOnly, validation, ...props }) => {
  const hasError = validation?.error

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          aria-invalid={!!hasError}
          className={cn(readOnly && 'bg-muted/40 text-muted-foreground cursor-not-allowed', readOnly && 'pr-20')}
          {...props}
        />
        {readOnly && (
          <Badge variant="secondary" className="absolute inset-y-0 right-2 my-auto h-fit">Read-only</Badge>
        )}
      </div>
      {hasError && <p className="text-xs text-destructive">{validation.error}</p>}
      {validation?.hint && !hasError && <p className="text-xs text-muted-foreground">{validation.hint}</p>}
    </div>
  )
}
