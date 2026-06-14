import { v4 as uuidv4 } from 'uuid'
import { Form, FormField, FormSection, FieldType, FieldOption } from './types'

const LABELS: Record<FieldType, string> = {
  text: 'Text Field',
  number: 'Number Field',
  date: 'Date Field',
  dropdown: 'Dropdown',
  checkbox: 'Checkbox Group',
  radio: 'Radio Group',
}

function defaultOptions(): FieldOption[] {
  return [
    { id: uuidv4(), label: 'Option 1', value: 'option_1' },
    { id: uuidv4(), label: 'Option 2', value: 'option_2' },
  ]
}

export function createDefaultField(type: FieldType): FormField {
  const base = {
    id: uuidv4(),
    label: LABELS[type],
    placeholder: '',
    helpText: '',
    required: false,
    visibility: 'private' as const,
    conditions: [],
  }

  switch (type) {
    case 'text':
      return { ...base, type, config: { multiline: false, rows: 3 } }
    case 'number':
      return { ...base, type, config: { decimal: false, decimalPlaces: 2, unit: '' } }
    case 'date':
      return { ...base, type, config: { includeTime: false, minDate: '', maxDate: '' } }
    case 'dropdown':
    case 'radio':
    case 'checkbox':
      return { ...base, type, config: { options: defaultOptions() } }
  }
}

export function createDefaultSection(order: number): FormSection {
  return {
    id: uuidv4(),
    title: `Section ${order + 1}`,
    description: '',
    fields: [],
    collapsed: false,
  }
}

export function createEmptyForm(projectId: string): Form {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    name: 'Untitled Form',
    description: '',
    projectId,
    status: 'draft',
    siteAssignment: 'all',
    siteIds: [],
    interventionAssignment: 'all',
    interventionTypes: [],
    sections: [createDefaultSection(0)],
    createdAt: now,
    updatedAt: now,
  }
}
