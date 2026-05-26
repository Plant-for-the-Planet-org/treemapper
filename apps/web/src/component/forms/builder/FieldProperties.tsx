'use client'

import React from 'react'
import { useBuilder } from '@/forms/FormBuilderContext'
import { FormField, FieldType } from '@/forms/types'
import ConditionalLogicPanel from './ConditionalLogicPanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, GripVertical, Settings, GitBranch, MousePointerClick } from 'lucide-react'
import { RATING_ICONS } from '@/forms/constants'
import { FIELD_TYPE_META } from '@/forms/constants'
import {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type, Hash, Calendar, ChevronDown, CheckSquare,
  CircleDot, PenLine, SlidersHorizontal, Star,
}

interface ToggleProps { value: boolean; onChange: (v: boolean) => void; label: string }
function Toggle({ value, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-sm text-gray-700 cursor-pointer" onClick={() => onChange(!value)}>{label}</Label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${value ? 'bg-green-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

interface SectionProps { title: string; children: React.ReactNode }
function PropSection({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  )
}

interface FieldPropertiesContentProps {
  field: FormField
  sectionId: string
}

function FieldPropertiesContent({ field, sectionId }: FieldPropertiesContentProps) {
  const { dispatch } = useBuilder()

  const update = (payload: Partial<FormField>) =>
    dispatch({ type: 'UPDATE_FIELD', sectionId, fieldId: field.id, payload })

  const hasOptions = field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox'

  return (
    <div className="space-y-5">
      <PropSection title="Basic">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Label</Label>
          <Input
            value={field.label}
            onChange={e => update({ label: e.target.value })}
            placeholder="Field label"
            className="h-8 text-sm"
          />
        </div>

        {field.type !== 'signature' && field.type !== 'rating' && field.type !== 'slider' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Placeholder</Label>
            <Input
              value={field.placeholder}
              onChange={e => update({ placeholder: e.target.value })}
              placeholder="Placeholder text"
              className="h-8 text-sm"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Help text</Label>
          <Input
            value={field.helpText}
            onChange={e => update({ helpText: e.target.value })}
            placeholder="Optional guidance for the user"
            className="h-8 text-sm"
          />
        </div>

        <Toggle
          label="Required"
          value={field.required}
          onChange={v => update({ required: v })}
        />
      </PropSection>

      {/* Text specific */}
      {field.type === 'text' && (
        <PropSection title="Text Settings">
          <Toggle
            label="Multiline (textarea)"
            value={field.textConfig.multiline}
            onChange={v => update({ textConfig: { ...field.textConfig, multiline: v } })}
          />
          {field.textConfig.multiline && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Rows</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={field.textConfig.rows}
                onChange={e => update({ textConfig: { ...field.textConfig, rows: Number(e.target.value) } })}
                className="h-8 text-sm"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Min length</Label>
              <Input
                type="number"
                min={0}
                value={field.textConfig.minLength ?? ''}
                onChange={e => update({ textConfig: { ...field.textConfig, minLength: e.target.value ? Number(e.target.value) : undefined } })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Max length</Label>
              <Input
                type="number"
                min={1}
                value={field.textConfig.maxLength ?? ''}
                onChange={e => update({ textConfig: { ...field.textConfig, maxLength: e.target.value ? Number(e.target.value) : undefined } })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </PropSection>
      )}

      {/* Number specific */}
      {field.type === 'number' && (
        <PropSection title="Number Settings">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Min value</Label>
              <Input
                type="number"
                value={field.numberConfig.min ?? ''}
                onChange={e => update({ numberConfig: { ...field.numberConfig, min: e.target.value ? Number(e.target.value) : undefined } })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Max value</Label>
              <Input
                type="number"
                value={field.numberConfig.max ?? ''}
                onChange={e => update({ numberConfig: { ...field.numberConfig, max: e.target.value ? Number(e.target.value) : undefined } })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Toggle
            label="Allow decimals"
            value={field.numberConfig.decimal}
            onChange={v => update({ numberConfig: { ...field.numberConfig, decimal: v } })}
          />
          {field.numberConfig.decimal && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Decimal places</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={field.numberConfig.decimalPlaces}
                onChange={e => update({ numberConfig: { ...field.numberConfig, decimalPlaces: Number(e.target.value) } })}
                className="h-8 text-sm"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Unit suffix (e.g. kg, m)</Label>
            <Input
              value={field.numberConfig.unit}
              onChange={e => update({ numberConfig: { ...field.numberConfig, unit: e.target.value } })}
              placeholder="Optional unit"
              className="h-8 text-sm"
            />
          </div>
        </PropSection>
      )}

      {/* Date specific */}
      {field.type === 'date' && (
        <PropSection title="Date Settings">
          <Toggle
            label="Include time"
            value={field.dateConfig.includeTime}
            onChange={v => update({ dateConfig: { ...field.dateConfig, includeTime: v } })}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Earliest date</Label>
            <Input
              type="date"
              value={field.dateConfig.minDate}
              onChange={e => update({ dateConfig: { ...field.dateConfig, minDate: e.target.value } })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Latest date</Label>
            <Input
              type="date"
              value={field.dateConfig.maxDate}
              onChange={e => update({ dateConfig: { ...field.dateConfig, maxDate: e.target.value } })}
              className="h-8 text-sm"
            />
          </div>
        </PropSection>
      )}

      {/* Options editor */}
      {hasOptions && (
        <PropSection title="Options">
          <div className="space-y-1.5">
            {field.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-1.5">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <Input
                  value={opt.label}
                  onChange={e => dispatch({
                    type: 'UPDATE_OPTION',
                    sectionId,
                    fieldId: field.id,
                    optionId: opt.id,
                    label: e.target.value,
                  })}
                  className="h-7 text-sm flex-1"
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  onClick={() => dispatch({ type: 'REMOVE_OPTION', sectionId, fieldId: field.id, optionId: opt.id })}
                  className="p-1 text-gray-300 hover:text-red-500 rounded"
                  disabled={field.options.length <= 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => dispatch({ type: 'ADD_OPTION', sectionId, fieldId: field.id })}
              className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add option
            </button>
          </div>
        </PropSection>
      )}

      {/* Slider specific */}
      {field.type === 'slider' && (
        <PropSection title="Slider Settings">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Min</Label>
              <Input
                type="number"
                value={field.sliderConfig.min}
                onChange={e => update({ sliderConfig: { ...field.sliderConfig, min: Number(e.target.value) } })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Max</Label>
              <Input
                type="number"
                value={field.sliderConfig.max}
                onChange={e => update({ sliderConfig: { ...field.sliderConfig, max: Number(e.target.value) } })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Step</Label>
              <Input
                type="number"
                min={1}
                value={field.sliderConfig.step}
                onChange={e => update({ sliderConfig: { ...field.sliderConfig, step: Number(e.target.value) } })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Toggle
            label="Show current value"
            value={field.sliderConfig.showValue}
            onChange={v => update({ sliderConfig: { ...field.sliderConfig, showValue: v } })}
          />
        </PropSection>
      )}

      {/* Rating specific */}
      {field.type === 'rating' && (
        <PropSection title="Rating Settings">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Max rating</Label>
            <Input
              type="number"
              min={3}
              max={10}
              value={field.ratingConfig.maxRating}
              onChange={e => update({ ratingConfig: { ...field.ratingConfig, maxRating: Number(e.target.value) } })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Icon type</Label>
            <Select
              value={field.ratingConfig.icon}
              onValueChange={val => update({ ratingConfig: { ...field.ratingConfig, icon: val as 'star' | 'heart' | 'thumbs' } })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATING_ICONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PropSection>
      )}
    </div>
  )
}

export default function FieldProperties() {
  const { state, selectedField, dispatch } = useBuilder()
  const { selectedFieldId, selectedSectionId, activeTab, form } = state

  if (!selectedField || !selectedFieldId || !selectedSectionId) {
    // Show "add field" hints when a section is selected
    if (selectedSectionId) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <MousePointerClick className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">Click a field to edit</p>
          <p className="text-xs text-gray-400">or drag a field type from the palette onto the canvas</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Settings className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-600 mb-1">Select a field to configure it</p>
        <p className="text-xs text-gray-400">Click any field on the canvas to see its properties here</p>
      </div>
    )
  }

  const meta = FIELD_TYPE_META.find(m => m.type === selectedField.type)!
  const Icon = ICON_MAP[meta.icon]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 flex-shrink-0">
        {Icon && (
          <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${meta.color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{selectedField.label || 'Untitled'}</p>
          <p className="text-xs text-gray-400">{meta.label}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {(['properties', 'conditions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium capitalize transition-colors
              ${activeTab === tab
                ? 'border-b-2 border-green-600 text-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab === 'properties' ? <Settings className="w-3.5 h-3.5" /> : <GitBranch className="w-3.5 h-3.5" />}
            {tab}
            {tab === 'conditions' && selectedField.conditions.length > 0 && (
              <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-1.5 py-0.5 leading-none">
                {selectedField.conditions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'properties' ? (
          <FieldPropertiesContent field={selectedField} sectionId={selectedSectionId} />
        ) : (
          <ConditionalLogicPanel
            fieldId={selectedFieldId}
            sectionId={selectedSectionId}
            conditions={selectedField.conditions}
          />
        )}
      </div>
    </div>
  )
}
