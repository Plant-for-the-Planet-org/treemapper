import { FieldType } from './types'

export interface FieldTypeMeta {
  type: FieldType
  label: string
  description: string
  icon: string
  color: string
}

export const FIELD_TYPE_META: FieldTypeMeta[] = [
  { type: 'text', label: 'Text', description: 'Single or multiline text', icon: 'Type', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { type: 'number', label: 'Number', description: 'Numeric input with optional unit', icon: 'Hash', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { type: 'date', label: 'Date', description: 'Date and optional time picker', icon: 'Calendar', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { type: 'dropdown', label: 'Dropdown', description: 'Select one from a list', icon: 'ChevronDown', color: 'bg-green-50 text-green-600 border-green-200' },
  { type: 'checkbox', label: 'Checkbox', description: 'Multi-select from options', icon: 'CheckSquare', color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { type: 'radio', label: 'Radio', description: 'Single choice from options', icon: 'CircleDot', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
]

// Intervention type values, mirroring the backend `interventionTypeEnum`. Used
// by the form targeting dropdown. Labels are derived from the value so the list
// stays in one place.
export const INTERVENTION_TYPE_VALUES = [
  'assisting-seed-rain',
  'control-livestock',
  'direct-seeding',
  'enrichment-planting',
  'fencing',
  'fire-patrol',
  'fire-suppression',
  'firebreaks',
  'generic-tree-registration',
  'grass-suppression',
  'liberating-regenerant',
  'maintenance',
  'marking-regenerant',
  'multi-tree-registration',
  'other-intervention',
  'plot-plant-registration',
  'removal-invasive-species',
  'sample-tree-registration',
  'single-tree-registration',
  'soil-improvement',
  'stop-tree-harvesting',
] as const

/** "removal-invasive-species" -> "Removal Invasive Species" */
export function interventionTypeLabel(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export const INTERVENTION_TYPE_OPTIONS = INTERVENTION_TYPE_VALUES.map(value => ({
  value,
  label: interventionTypeLabel(value),
}))

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]
