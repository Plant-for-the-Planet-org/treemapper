import {
  FieldVisibility,
  FormField,
  FormSection,
  FormValues,
} from 'src/types/interface/projectForm.interface'
import { evaluateFieldVisibility, getAllFields } from './formConditions'

// Slugify a label into a metadata key. Mirrors formatString() used by
// InterventionPreviewView.setupMetaData so form answers sit alongside the
// existing metadata entries in the same shape.
const slug = (s: string): string => (s || '').toLowerCase().replace(/\s+/g, '-')

export interface FormMetaEntry {
  key: string
  originalKey: string
  value: string
  label: string
  type: 'input'
  unit: string
  visibility: FieldVisibility
  dataType: 'string'
  // Distinguishes form answers from device/manual metadata entries, and lets
  // the preview save-gate know which form an answer belongs to.
  elementType: 'form'
  formId: string
}

// Form answers split into the public and private buckets that mirror the shape
// of an intervention's meta_data.
export interface FormMetaEntries {
  private: Record<string, FormMetaEntry>
  public: Record<string, FormMetaEntry>
}

// Builds flat metadata entries for a form's answers, routing each field to the
// public or private bucket per its `visibility` (default private). Only fields
// that are currently visible (per their conditions) are included.
export const buildFormMetaEntries = (
  formId: string,
  sections: FormSection[],
  values: FormValues,
): FormMetaEntries => {
  const result: FormMetaEntries = { private: {}, public: {} }
  const fields: FormField[] = getAllFields(sections)
  fields.forEach((field) => {
    if (!evaluateFieldVisibility(field, values)) return
    const visibility: FieldVisibility =
      field.visibility === 'public' ? 'public' : 'private'
    const key = slug(field.label) || field.id
    result[visibility][key] = {
      key,
      originalKey: key,
      value: String(values[field.id] ?? ''),
      label: field.label,
      type: 'input',
      unit: field.config?.unit ?? '',
      visibility,
      dataType: 'string',
      elementType: 'form',
      formId,
    }
  })
  return result
}

// Reads the distinct form ids already answered on an intervention by scanning
// both meta_data buckets (private and public) for entries tagged
// elementType:'form'. Scanning both matters for forms whose fields are all
// public, otherwise the save-gate would never see them as confirmed. Used by
// the preview save-gate to know which required forms are confirmed.
export const getConfirmedFormIds = (metaDataJson: string): Set<string> => {
  const confirmed = new Set<string>()
  if (!metaDataJson) return confirmed
  try {
    const parsed = JSON.parse(metaDataJson)
    const buckets = [parsed?.private || {}, parsed?.public || {}]
    buckets.forEach((bucket) => {
      Object.keys(bucket).forEach((k) => {
        const entry = bucket[k]
        if (entry?.elementType === 'form' && entry?.formId) {
          confirmed.add(entry.formId)
        }
      })
    })
  } catch (error) {
    // ignore malformed metadata
  }
  return confirmed
}
