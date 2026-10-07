import { v4 as uuid } from 'uuid'
import { IAdditionalDetailsForm } from 'src/types/interface/app.interface'
import { FormElement } from 'src/types/interface/form.interface'
import {
  FieldOption,
  FieldVisibility,
  FormField,
  FormFieldType,
  FormSection,
} from 'src/types/interface/projectForm.interface'

// Converts a form built with the retired on-device Additional Data builder into
// the section/field tree the dashboard Forms API stores.
//
// The two models do not line up one to one, so the conversion is lossy in ways
// the user has to see before it is sent:
//   - the old builder had layout elements (GAP) and a HEADING that only drew a
//     title. HEADING becomes a section boundary, GAP has no target and is left
//     behind.
//   - the old builder had no date or multi-select field, so nothing maps to
//     those; YES_NO becomes a two-option radio, which is what it was.
//   - the old `key` ("advance field") is gone. A form answer is now keyed by
//     slugifyLabel(field.label), so a field keeps its answers lined up with the
//     old ones only while its label is unchanged.
//
// `dropped` carries every element that did not make it, so the review screen
// can name them instead of silently shrinking the form.

export interface DroppedElement {
  label: string
  type: string
  reason: string
}

export interface ConvertedLegacyForm {
  sections: FormSection[]
  fieldCount: number
  dropped: DroppedElement[]
}

const DEFAULT_SECTION_TITLE = 'Details'

const toVisibility = (value: string | undefined): FieldVisibility =>
  value === 'public' ? 'public' : 'private'

// The builder wrote its dropdown options as a JSON string of { key, value, id },
// where `key` is what the user saw. An unreadable blob is treated as no options.
const parseOptions = (raw: string | undefined): FieldOption[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((option) => option && (option.key || option.value))
      .map((option) => ({
        id: option.id || uuid(),
        label: String(option.key ?? option.value ?? ''),
        value: String(option.value ?? option.key ?? ''),
      }))
  } catch (error) {
    return []
  }
}

const isNumeric = (element: FormElement): boolean =>
  element.data_type === 'number' || element.keyboard_type === 'numeric'

const baseField = (element: FormElement, type: FormFieldType, config: any): FormField => ({
  id: element.element_id || uuid(),
  type,
  label: element.label || element.key || 'Untitled field',
  placeholder: element.placeholder || '',
  // The old builder had no help text. A unit on a text field has nowhere else
  // to live, so it is kept here rather than thrown away.
  helpText: type !== 'number' && element.unit ? element.unit : '',
  required: !!element.required,
  visibility: toVisibility(element.visibility),
  conditions: [],
  config,
})

const convertElement = (
  element: FormElement,
): { field?: FormField; dropped?: DroppedElement } => {
  const label = element.label || element.key || 'Untitled'
  switch (element.type) {
    case 'INPUT':
      return {
        field: isNumeric(element)
          ? baseField(element, 'number', {
              decimal: true,
              decimalPlaces: 2,
              unit: element.unit || '',
            })
          : baseField(element, 'text', { multiline: false, rows: 1 }),
      }
    case 'TEXTAREA':
      return { field: baseField(element, 'text', { multiline: true, rows: 4 }) }
    case 'YES_NO':
      return {
        field: baseField(element, 'radio', {
          options: [
            { id: uuid(), label: 'Yes', value: 'true' },
            { id: uuid(), label: 'No', value: 'false' },
          ],
        }),
      }
    case 'DROPDOWN': {
      const options = parseOptions(element.dropDownData)
      if (options.length === 0) {
        return { dropped: { label, type: 'Dropdown', reason: 'no options were saved' } }
      }
      return { field: baseField(element, 'dropdown', { options }) }
    }
    case 'GAP':
      return { dropped: { label: label || 'Spacer', type: 'Spacer', reason: 'Forms has no spacer' } }
    default:
      return {
        dropped: { label, type: element.type || 'Unknown', reason: 'no matching field type' },
      }
  }
}

export const convertLegacyForm = (form: IAdditionalDetailsForm): ConvertedLegacyForm => {
  const sections: FormSection[] = []
  const dropped: DroppedElement[] = []
  let fieldCount = 0

  const openSection = (title: string, description = '') => {
    const section: FormSection = {
      id: uuid(),
      title,
      description,
      collapsed: false,
      fields: [],
    }
    sections.push(section)
    return section
  }

  // Everything before the first heading belongs to a section of its own, named
  // after the form so an unnamed one still reads as something.
  let current = openSection(form.title || DEFAULT_SECTION_TITLE, form.description || '')

  const elements: FormElement[] = [...(form.elements || [])]
  elements.forEach((element) => {
    if (element.type === 'HEADING') {
      current = openSection(element.label || element.key || DEFAULT_SECTION_TITLE)
      return
    }
    const { field, dropped: skipped } = convertElement(element)
    if (field) {
      current.fields.push(field)
      fieldCount += 1
      return
    }
    if (skipped) dropped.push(skipped)
  })

  // A heading with nothing under it would reach the dashboard as an empty
  // section, which reads as a bug rather than as a title.
  return {
    sections: sections.filter((section) => section.fields.length > 0),
    fieldCount,
    dropped,
  }
}

// A form with no convertible field cannot be synced: the dashboard would get an
// empty shell.
export const isSyncable = (converted: ConvertedLegacyForm): boolean =>
  converted.fieldCount > 0
