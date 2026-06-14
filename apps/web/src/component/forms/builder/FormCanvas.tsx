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
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-4">
        {/* Form description */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <input
            className="w-full text-xl font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
            placeholder="Form description (optional)"
            value={form.description}
            onChange={e => dispatch({ type: 'UPDATE_META', payload: { description: e.target.value } })}
          />
        </div>

        {/* Form-level targeting: which sites + intervention types show this form */}
        <FormSettingsCard />

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
  )
}
