import { ChevronDown, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Option { value: string; label: string }

interface Props {
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export const MultiSelectDropdown = ({ options, selected, onChange, placeholder = 'Select...' }: Props) => {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-between text-xs font-normal">
          <span className="truncate">
            {selected.length === 0 ? placeholder : `${selected.length} selected`}
          </span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggle(option.value)}
                    className="text-xs cursor-pointer"
                  >
                    <div className={cn(
                      'mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border',
                      isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                    )}>
                      {isSelected && <Check size={10} />}
                    </div>
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
