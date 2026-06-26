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
import { useBuilder } from '@/forms/FormBuilderContext'
import { FieldType } from '@/forms/types'
import BuilderTopBar from './BuilderTopBar'
import FormCanvas from './FormCanvas'
import FieldProperties from './FieldProperties'
import MobilePreview from './MobilePreview'
import { FIELD_TYPE_META } from '@/forms/constants'
import { getFieldIcon } from '@/forms/icons'

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
}

export default function FormBuilder() {
  const { state, dispatch } = useBuilder()
  const { form, showPreview } = state
  const [, setActiveOverSectionId] = useState<string | null>(null)
  const [activeFieldType, setActiveFieldType] = useState<FieldType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const sectionIds = form.sections.map(s => s.id)

  // Find which section a field belongs to
  const findFieldSection = (fieldId: string) =>
    form.sections.find(s => s.fields.some(f => f.id === fieldId))

  const handleDragStart = (event: DragStartEvent) => {
    setActiveOverSectionId(null)
    const id = String(event.active.id)
    if (id.startsWith('palette::')) {
      setActiveFieldType(id.replace('palette::', '') as FieldType)
    } else {
      setActiveFieldType(null)
    }
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
    setActiveFieldType(null)
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

  const overlayMeta = activeFieldType ? FIELD_TYPE_META.find(m => m.type === activeFieldType) : null
  const OverlayIcon = activeFieldType ? getFieldIcon(activeFieldType) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        <BuilderTopBar />
        <div className="flex overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
          <FormCanvas />
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
            {showPreview ? (
              <MobilePreview />
            ) : (
              <FieldProperties />
            )}
          </div>
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
