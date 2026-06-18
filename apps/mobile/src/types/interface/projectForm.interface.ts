// Types for the server-driven Forms feature (forms built on the web app and
// synced to mobile). Kept separate from the legacy `FormElement` model in
// form.interface.ts to avoid the existing `Form`/`FormElement` name collision.

export type FormFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'radio'

export type SiteAssignment = 'all' | 'none' | 'specific'
export type InterventionAssignment = 'all' | 'specific'

// Whether a field's answer lands in meta_data.public or meta_data.private.
export type FieldVisibility = 'public' | 'private'

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'

export interface ConditionalRule {
  id: string
  targetFieldId: string
  operator: ConditionOperator
  value: string
  action: 'show' | 'hide'
}

export interface FieldOption {
  id: string
  label: string
  value: string
}

// `config` shape depends on the field type. Kept loose (all optional) because
// it arrives as free-form JSON from the server.
export interface FieldConfig {
  // text
  multiline?: boolean
  rows?: number
  minLength?: number
  maxLength?: number
  // number
  min?: number
  max?: number
  decimal?: boolean
  decimalPlaces?: number
  unit?: string
  // date
  includeTime?: boolean
  minDate?: string
  maxDate?: string
  // dropdown / checkbox / radio
  options?: FieldOption[]
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder: string
  helpText: string
  required: boolean
  // Older forms may not carry this; treated as 'private' when absent.
  visibility?: FieldVisibility
  conditions: ConditionalRule[]
  config: FieldConfig
}

export interface FormSection {
  id: string
  title: string
  description: string
  collapsed: boolean
  fields: FormField[]
}

// As returned by the server (GET /projects/:projectUid/forms).
export interface ServerForm {
  id: string
  name: string
  description: string
  projectId: string
  status: 'draft' | 'published'
  siteAssignment: SiteAssignment
  siteIds: string[]
  interventionAssignment: InterventionAssignment
  interventionTypes: string[]
  sections: FormSection[]
  createdAt: string
  updatedAt: string
}

// As stored in Realm (RealmSchema.ProjectForm). `sections` is a stringified
// JSON blob per the codebase convention (see FormElement.dropDownData,
// Intervention.meta_data).
export interface ProjectFormData {
  id: string
  name: string
  description: string
  project_id: string
  status: string
  site_assignment: SiteAssignment
  intervention_assignment: InterventionAssignment
  site_ids: string[]
  intervention_types: string[]
  sections: string
  created_at: string
  updated_at: string
}

// RealmSchema.FormPrefill — one reusable default value-set per form.
export interface FormPrefillData {
  form_id: string
  values: string // JSON: { [fieldId]: stringValue }
  updated_at: number
}

// Map keyed by fieldId -> stored string value.
export type FormValues = Record<string, string>
