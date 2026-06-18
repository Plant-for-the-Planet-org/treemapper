'use client'

import React from 'react'
import { useBuilder } from '@/forms/FormBuilderContext'
import { FormField, FormSection } from '@/forms/types'
import { Smartphone } from 'lucide-react'

function FieldPreview({ field }: { field: FormField }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-700">{field.label || 'Untitled'}</span>
        {field.required && <span className="text-red-500 text-xs">*</span>}
      </div>
      {field.helpText && <p className="text-xs text-gray-400">{field.helpText}</p>}

      {field.type === 'text' && !field.config.multiline && (
        <input
          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400"
          placeholder={field.placeholder || 'Enter text...'}
          readOnly
        />
      )}

      {field.type === 'text' && field.config.multiline && (
        <textarea
          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400 resize-none"
          placeholder={field.placeholder || 'Enter text...'}
          rows={field.config.rows}
          readOnly
        />
      )}

      {field.type === 'number' && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="flex-1 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400"
            placeholder={field.placeholder || '0'}
            readOnly
          />
          {field.config.unit && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded-md px-2 py-1.5">{field.config.unit}</span>
          )}
        </div>
      )}

      {field.type === 'date' && (
        <input
          type={field.config.includeTime ? 'datetime-local' : 'date'}
          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400"
          readOnly
        />
      )}

      {field.type === 'dropdown' && (
        <select className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-400">
          <option value="">{field.placeholder || 'Select an option...'}</option>
          {field.config.options.map(o => <option key={o.id} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-1.5">
          {field.config.options.map(o => (
            <label key={o.id} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={field.id} className="accent-green-600" />
              <span className="text-xs text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-1.5">
          {field.config.options.map(o => (
            <label key={o.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-green-600 rounded" />
              <span className="text-xs text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionPreview({ section }: { section: FormSection }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
        {section.description && <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>}
      </div>
      {section.fields.map(field => (
        <FieldPreview key={field.id} field={field} />
      ))}
    </div>
  )
}

export default function MobilePreview() {
  const { state } = useBuilder()
  const { form } = state
  const totalFields = form.sections.reduce((a, s) => a + s.fields.length, 0)

  return (
    <div className="flex-shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden w-full h-full">
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Preview</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        {/* Phone frame */}
        <div className="w-full max-w-[260px]">
          <div className="border-4 border-gray-800 rounded-[32px] overflow-hidden shadow-xl bg-white">
            {/* Status bar */}
            <div className="bg-gray-800 px-4 py-1.5 flex justify-between items-center">
              <span className="text-white text-xs">9:41</span>
              <div className="flex gap-1">
                <div className="w-3 h-1.5 bg-white rounded-full" />
                <div className="w-3 h-1.5 bg-white rounded-full opacity-60" />
                <div className="w-3 h-1.5 bg-white rounded-full opacity-40" />
              </div>
            </div>

            {/* App header */}
            <div className="bg-green-600 px-4 py-3">
              <p className="text-white text-sm font-semibold truncate">{form.name}</p>
              <p className="text-green-100 text-xs">{totalFields} fields</p>
            </div>

            {/* Form content */}
            <div className="p-4 space-y-6 max-h-[480px] overflow-y-auto">
              {form.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-300 text-xs">
                  Add sections and fields to preview
                </div>
              ) : (
                form.sections.map(section => (
                  <SectionPreview key={section.id} section={section} />
                ))
              )}
            </div>

            {/* Submit button */}
            {totalFields > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button className="w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl">
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
