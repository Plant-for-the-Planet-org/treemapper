'use client'

import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormSection } from '@/forms/types'
import { useBuilder } from '@/forms/FormBuilderContext'
import FieldBlock from './FieldBlock'
import { GripVertical, ChevronDown, ChevronRight, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import BlockInserter from './BlockInserter'
import { FieldType } from '@/forms/types'

interface SectionBlockProps {
  section: FormSection
  selectedFieldId: string | null
  selectedSectionId: string | null
}

export default function SectionBlock({ section, selectedFieldId, selectedSectionId }: SectionBlockProps) {
  const { dispatch } = useBuilder()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title)

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `section-drop::${section.id}`,
    data: { type: 'section', sectionId: section.id },
  })

  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: 'section', sectionId: section.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const commitTitle = () => {
    dispatch({ type: 'UPDATE_SECTION', sectionId: section.id, payload: { title: titleDraft || 'Untitled Section' } })
    setEditingTitle(false)
  }

  const fieldIds = section.fields.map(f => f.id)

  const addField = (fieldType: FieldType) =>
    dispatch({ type: 'ADD_FIELD', sectionId: section.id, fieldType })

  return (
    <div ref={setSortRef} style={style} className="group/section">
      <div className={`rounded-lg transition-colors ${isOver && !isDragging ? 'bg-gray-50' : ''}`}>
        {/* Section header */}
        <div className="flex items-center gap-1.5 py-1">
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 rounded text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover/section:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch({ type: 'UPDATE_SECTION', sectionId: section.id, payload: { collapsed: !section.collapsed } })}
            className="p-0.5 text-gray-400 hover:text-gray-600"
          >
            {section.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                  className="h-7 text-sm font-semibold"
                />
                <button onClick={commitTitle} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingTitle(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-base font-semibold text-gray-900">{section.title}</span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
            <button
              onClick={() => { setTitleDraft(section.title); setEditingTitle(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_SECTION', sectionId: section.id })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs text-gray-400 flex-shrink-0">{section.fields.length} fields</span>
        </div>

        {/* Section body */}
        {!section.collapsed && (
          <div ref={setDropRef} className="pl-7 pr-1 pt-1">
            <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {section.fields.map((field, index) => (
                  <FieldBlock
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    index={index}
                    isSelected={selectedFieldId === field.id && selectedSectionId === section.id}
                  />
                ))}
              </div>
            </SortableContext>

            {section.fields.length === 0 ? (
              <BlockInserter onSelect={addField} align="center">
                <button
                  className={`w-full rounded-lg border border-dashed p-5 text-center transition-colors
                    ${isOver ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <span className="text-sm text-gray-400">Click to add a field, or drag one here</span>
                </button>
              </BlockInserter>
            ) : (
              <BlockInserter onSelect={addField} align="start">
                <button
                  className="mt-1 flex items-center gap-1.5 py-1.5 px-2 -ml-2 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add field
                </button>
              </BlockInserter>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
