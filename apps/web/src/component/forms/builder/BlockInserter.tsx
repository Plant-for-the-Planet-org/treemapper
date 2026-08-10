'use client'

import React, { useState } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { FIELD_TYPE_META } from '@/forms/constants'
import { FieldType } from '@/forms/types'
import { getIconByName } from '@/forms/icons'

interface BlockInserterProps {
  /** Called with the chosen field type. The menu closes automatically. */
  onSelect: (type: FieldType) => void
  /** The trigger element (e.g. a "+" button). Rendered via `asChild`. */
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Notion / Tally style block inserter. A trigger opens a searchable command
 * menu of field types. Replaces the old left-hand FieldPalette sidebar so
 * elements are added inline, where they land.
 */
export default function BlockInserter({
  onSelect,
  children,
  align = 'start',
  side = 'bottom',
}: BlockInserterProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (type: FieldType) => {
    onSelect(type)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={6}
        className="w-72 p-0"
        onOpenAutoFocus={e => {
          // Let cmdk's input take focus instead of the popover root.
          e.preventDefault()
        }}
      >
        <Command>
          <CommandInput placeholder="Search for a field" />
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup heading="Basic fields">
              {FIELD_TYPE_META.map(meta => {
                const Icon = getIconByName(meta.icon)
                return (
                  <CommandItem
                    key={meta.type}
                    value={`${meta.label} ${meta.description}`}
                    onSelect={() => handleSelect(meta.type)}
                    className="gap-2.5 py-2"
                  >
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border ${meta.color}`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                      <span className="truncate text-xs text-gray-400">{meta.description}</span>
                    </div>
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
