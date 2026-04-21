'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { FIELD_TYPE_META, FieldTypeMeta } from '@/forms/constants'
import { FieldType } from '@/forms/types'
import {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star,
}

interface PaletteItemProps {
  meta: FieldTypeMeta
  onAdd: (type: FieldType) => void
}

function PaletteItem({ meta, onAdd }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette::${meta.type}`,
    data: { type: 'palette', fieldType: meta.type },
  })

  const Icon = ICON_MAP[meta.icon]

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all
        ${isDragging ? 'opacity-40 scale-95' : 'hover:bg-gray-50 hover:border-gray-300'}
        bg-white border-gray-200`}
      onClick={() => onAdd(meta.type)}
      title={meta.description}
    >
      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
      </div>
      <span className="text-sm font-medium text-gray-700 truncate">{meta.label}</span>
    </div>
  )
}

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void
}

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Field Types</h3>
        <p className="text-xs text-gray-400 mt-0.5">Drag or click to add</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {FIELD_TYPE_META.map(meta => (
          <PaletteItem key={meta.type} meta={meta} onAdd={onAddField} />
        ))}
      </div>
    </div>
  )
}
