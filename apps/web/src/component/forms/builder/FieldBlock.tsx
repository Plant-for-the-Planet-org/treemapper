'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField } from '@/forms/types'
import { useBuilder } from '@/forms/FormBuilderContext'
import { FIELD_TYPE_META } from '@/forms/constants'
import {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star,
  GripVertical, Trash2, GitBranch
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star,
}

interface FieldBlockProps {
  field: FormField
  sectionId: string
  isSelected: boolean
}

export default function FieldBlock({ field, sectionId, isSelected }: FieldBlockProps) {
  const { dispatch } = useBuilder()
  const meta = FIELD_TYPE_META.find(m => m.type === field.type)!
  const Icon = ICON_MAP[meta.icon]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { type: 'field', fieldId: field.id, sectionId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SELECT_FIELD', fieldId: field.id, sectionId })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_FIELD', sectionId, fieldId: field.id })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      className={`group relative flex items-start gap-2 p-3 rounded-lg border transition-all cursor-pointer
        ${isSelected
          ? 'border-green-400 bg-green-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 p-0.5 rounded text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
            {Icon && <Icon className="w-3 h-3" />}
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{meta.label}</span>
          {field.required && (
            <span className="text-red-500 text-xs ml-auto">*</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800 truncate">{field.label || 'Untitled field'}</p>
        {field.helpText && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{field.helpText}</p>
        )}
        {field.conditions.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <GitBranch className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-blue-400">{field.conditions.length} condition{field.conditions.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleDelete}
        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
