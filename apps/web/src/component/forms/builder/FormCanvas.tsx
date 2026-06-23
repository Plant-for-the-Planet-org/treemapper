'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useBuilder } from '@/forms/FormBuilderContext'
import SectionBlock from './SectionBlock'
import FormSettingsCard from './FormSettingsCard'
import { Plus, FileText } from 'lucide-react'

export default function FormCanvas() {
  const { state, dispatch } = useBuilder()
  const { form, selectedFieldId, selectedSectionId } = state

  const sectionIds = form.sections.map(s => s.id)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto py-12 px-6">
        {/* Form description doubles as the document title */}
        <textarea
          rows={1}
          className="w-full resize-none text-3xl font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-300 leading-tight"
          placeholder="Untitled form"
          value={form.description}
          onChange={e => dispatch({ type: 'UPDATE_META', payload: { description: e.target.value } })}
        />

        {/* Form-level targeting: which sites + intervention types show this form */}
        <div className="mt-4">
          <FormSettingsCard />
        </div>

        {form.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 mb-5">Start by adding a section</p>
            <button
              onClick={() => dispatch({ type: 'ADD_SECTION' })}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add section
            </button>
          </div>
        ) : (
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="mt-10 space-y-10">
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

        {form.sections.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'ADD_SECTION' })}
            className="mt-8 flex items-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add section
          </button>
        )}
      </div>
    </div>
  )
}
