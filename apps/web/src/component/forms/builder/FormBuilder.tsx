'use client'

import React from 'react'
import { useBuilder } from '@/forms/FormBuilderContext'
import { FieldType } from '@/forms/types'
import BuilderTopBar from './BuilderTopBar'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldProperties from './FieldProperties'
import MobilePreview from './MobilePreview'

export default function FormBuilder() {
  const { state, dispatch } = useBuilder()
  const { showPreview } = state

  const handleAddFromPalette = (type: FieldType) => {
    const targetSectionId =
      state.selectedSectionId ??
      state.form.sections[0]?.id

    if (targetSectionId) {
      dispatch({ type: 'ADD_FIELD', sectionId: targetSectionId, fieldType: type })
    } else {
      dispatch({ type: 'ADD_SECTION' })
      // Field will be added to the new section via the next click
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <BuilderTopBar />
      <div className="flex overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
        <FieldPalette onAddField={handleAddFromPalette} />
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
  )
}
