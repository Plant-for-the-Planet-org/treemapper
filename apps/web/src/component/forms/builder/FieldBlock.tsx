'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField } from '@/forms/types'
import { useBuilder } from '@/forms/FormBuilderContext'
import { getFieldIcon } from '@/forms/icons'
import { GripVertical, Trash2, GitBranch, Plus } from 'lucide-react'
import BlockInserter from './BlockInserter'
import { FieldType } from '@/forms/types'

interface FieldBlockProps {
  field: FormField
  sectionId: string
  index: number
  isSelected: boolean
}

export default function FieldBlock({ field, sectionId, index, isSelected }: FieldBlockProps) {
  const { dispatch } = useBuilder()
  const Icon = getFieldIcon(field.type)

  const insertAfter = (fieldType: FieldType) =>
    dispatch({ type: 'ADD_FIELD', sectionId, fieldType, atIndex: index + 1 })

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
      className={`group relative flex items-start gap-1 px-1.5 py-2 rounded-md transition-colors cursor-pointer
        ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
    >
      <div className="mt-0.5 flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <BlockInserter onSelect={insertAfter} side="right" align="start">
          <button
            onClick={e => e.stopPropagation()}
            className="p-0.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100"
            title="Add field below"
          >
            <Plus className="w-4 h-4" />
          </button>
        </BlockInserter>
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-w-0 pl-0.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-800 truncate">{field.label || 'Untitled field'}</span>
          {field.required && <span className="text-red-400 text-sm leading-none">*</span>}
          {field.visibility === 'public' && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 leading-none">Public</span>
          )}
        </div>
        {field.helpText && (
          <p className="text-xs text-gray-400 mt-0.5 truncate pl-6">{field.helpText}</p>
        )}
        {field.conditions.length > 0 && (
          <div className="flex items-center gap-1 mt-1 pl-6">
            <GitBranch className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{field.conditions.length} condition{field.conditions.length > 1 ? 's' : ''}</span>
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
