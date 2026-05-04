import { v4 as uuidv4 } from 'uuid'
import { Form, FormField, FormSection, FieldType } from './types'

export function createDefaultField(type: FieldType): FormField {
  const labelMap: Record<FieldType, string> = {
    text: 'Text Field',
    number: 'Number Field',
    date: 'Date Field',
    dropdown: 'Dropdown',
    checkbox: 'Checkbox Group',
    radio: 'Radio Group',
    signature: 'Signature',
    slider: 'Slider',
    rating: 'Rating',
  }

  const hasOptions = type === 'dropdown' || type === 'radio' || type === 'checkbox'

  return {
    id: uuidv4(),
    type,
    label: labelMap[type],
    placeholder: '',
    helpText: '',
    required: false,
    options: hasOptions
      ? [
          { id: uuidv4(), label: 'Option 1', value: 'option_1' },
          { id: uuidv4(), label: 'Option 2', value: 'option_2' },
        ]
      : [],
    textConfig: { multiline: false, rows: 3 },
    numberConfig: { decimal: false, decimalPlaces: 2, unit: '' },
    dateConfig: { includeTime: false, minDate: '', maxDate: '' },
    sliderConfig: { min: 0, max: 100, step: 1, showValue: true },
    ratingConfig: { maxRating: 5, icon: 'star' },
    conditions: [],
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
  return {
    id: uuidv4(),
    name: 'Untitled Form',
    description: '',
    projectId,
    status: 'draft',
    sections: [createDefaultSection(0)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
