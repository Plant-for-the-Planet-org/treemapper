'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useBuilder } from '@/forms/FormBuilderContext'
import { FieldType } from '@/forms/types'
import SectionBlock from './SectionBlock'
import { Plus, FileText } from 'lucide-react'
import { FIELD_TYPE_META } from '@/forms/constants'
import {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star,
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
}

export default function FormCanvas() {
  const { state, dispatch } = useBuilder()
  const { form, selectedFieldId, selectedSectionId } = state
  const [activeOverSectionId, setActiveOverSectionId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const sectionIds = form.sections.map(s => s.id)

  // Find which section a field belongs to
  const findFieldSection = (fieldId: string) =>
    form.sections.find(s => s.fields.some(f => f.id === fieldId))

  const handleDragStart = (_event: DragStartEvent) => {
    setActiveOverSectionId(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) return

    const overId = String(over.id)
    if (overId.startsWith('section-drop::')) {
      setActiveOverSectionId(overId.replace('section-drop::', ''))
    } else {
      const sec = findFieldSection(overId)
      setActiveOverSectionId(sec?.id ?? null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveOverSectionId(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeData = active.data.current as Record<string, unknown>

    // ── Palette drop → create new field ──
    if (activeId.startsWith('palette::')) {
      const fieldType = activeId.replace('palette::', '') as FieldType

      let targetSectionId: string | null = null
      if (overId.startsWith('section-drop::')) {
        targetSectionId = overId.replace('section-drop::', '')
      } else {
        const sec = findFieldSection(overId)
        targetSectionId = sec?.id ?? form.sections[0]?.id ?? null
      }
      // Also handle dropping directly onto a section sortable id
      if (!targetSectionId && sectionIds.includes(overId)) {
        targetSectionId = overId
      }

      if (targetSectionId) {
        dispatch({ type: 'ADD_FIELD', sectionId: targetSectionId, fieldType })
      }
      return
    }

    // ── Section reorder ──
    if (activeData?.type === 'section' && sectionIds.includes(overId)) {
      dispatch({ type: 'REORDER_SECTIONS', activeId, overId })
      return
    }

    // ── Field reorder / cross-section move ──
    if (activeData?.type === 'field') {
      const fromSectionId = activeData.sectionId as string

      if (overId.startsWith('section-drop::')) {
        const toSectionId = overId.replace('section-drop::', '')
        if (fromSectionId !== toSectionId) {
          const toSection = form.sections.find(s => s.id === toSectionId)
          dispatch({
            type: 'MOVE_FIELD',
            fromSectionId,
            toSectionId,
            fieldId: activeId,
            toIndex: toSection?.fields.length ?? 0,
          })
        }
        return
      }

      const toSection = findFieldSection(overId)
      if (!toSection) return

      if (fromSectionId === toSection.id) {
        dispatch({ type: 'REORDER_FIELDS', sectionId: fromSectionId, activeId, overId })
      } else {
        const toIndex = toSection.fields.findIndex(f => f.id === overId)
        dispatch({
          type: 'MOVE_FIELD',
          fromSectionId,
          toSectionId: toSection.id,
          fieldId: activeId,
          toIndex: toIndex >= 0 ? toIndex : toSection.fields.length,
        })
      }
    }
  }

  // DragOverlay content for palette drags
  const [activeFieldType, setActiveFieldType] = useState<FieldType | null>(null)

  const handleDragStartWithType = (event: DragStartEvent) => {
    handleDragStart(event)
    const id = String(event.active.id)
    if (id.startsWith('palette::')) {
      setActiveFieldType(id.replace('palette::', '') as FieldType)
    } else {
      setActiveFieldType(null)
    }
  }

  const overlayMeta = activeFieldType ? FIELD_TYPE_META.find(m => m.type === activeFieldType) : null
  const OverlayIcon = overlayMeta ? ICON_MAP[overlayMeta.icon] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStartWithType}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
          {/* Form description */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <input
              className="w-full text-xl font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
              placeholder="Form description (optional)"
              value={form.description}
              onChange={e => dispatch({ type: 'UPDATE_META', payload: { description: e.target.value } })}
            />
          </div>

          {form.sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No sections yet</p>
              <button
                onClick={() => dispatch({ type: 'ADD_SECTION' })}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
          ) : (
            <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {form.sections.map(section => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    selectedFieldId={selectedFieldId}
                    selectedSectionId={selectedSectionId}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          <button
            onClick={() => dispatch({ type: 'ADD_SECTION' })}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {overlayMeta && OverlayIcon && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg bg-white ${overlayMeta.color}`}>
            <OverlayIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{overlayMeta.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
