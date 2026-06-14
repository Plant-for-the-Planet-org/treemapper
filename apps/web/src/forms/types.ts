export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'radio'

export interface FieldOption {
  id: string
  label: string
  value: string
}

export interface TextConfig {
  multiline: boolean
  rows: number
  minLength?: number
  maxLength?: number
}

export interface NumberConfig {
  min?: number
  max?: number
  decimal: boolean
  decimalPlaces: number
  unit: string
}

export interface DateConfig {
  includeTime: boolean
  minDate: string
  maxDate: string
}

export interface ChoiceConfig {
  options: FieldOption[]
}

/**
 * Maps each field type to the shape of its `config`. This is the single source
 * of truth for the field/config relationship: the discriminated `FormField`
 * union below is derived from it, so adding a field type means adding one entry
 * here and one default in `defaults.ts`.
 */
export interface FieldConfigMap {
  text: TextConfig
  number: NumberConfig
  date: DateConfig
  dropdown: ChoiceConfig
  checkbox: ChoiceConfig
  radio: ChoiceConfig
}

/** Any field config, regardless of field type. */
export type FieldConfig = FieldConfigMap[FieldType]

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

/**
 * Whether a field's answer is stored in the public or private bucket of an
 * intervention's metadata on mobile. `private` keeps the answer internal;
 * `public` exposes it alongside the intervention's public data.
 */
export type FieldVisibility = 'public' | 'private'

/** Properties every field has, independent of its type. */
export interface BaseField {
  id: string
  label: string
  placeholder: string
  helpText: string
  required: boolean
  /** Routes the answer to meta_data.public or meta_data.private on mobile. */
  visibility: FieldVisibility
  conditions: ConditionalRule[]
}

/**
 * A field is a base plus exactly one `config`, matched to its `type`. Narrowing
 * on `field.type` narrows `field.config` to the right shape, so consumers never
 * have to carry config objects that do not apply to the field.
 */
export type FormField = {
  [K in FieldType]: BaseField & { type: K; config: FieldConfigMap[K] }
}[FieldType]

export interface FormSection {
  id: string
  title: string
  description: string
  fields: FormField[]
  collapsed: boolean
}

/**
 * Where a form is shown after an intervention is planted.
 * - `all`: every site (and interventions with no site)
 * - `none`: only interventions recorded without a site
 * - `specific`: only the sites listed in `siteIds`
 */
export type SiteAssignment = 'all' | 'none' | 'specific'

/**
 * Which intervention types trigger the form.
 * - `all`: every intervention type
 * - `specific`: only the types listed in `interventionTypes`
 */
export type InterventionAssignment = 'all' | 'specific'

export interface Form {
  id: string
  name: string
  description: string
  projectId: string
  status: 'draft' | 'published'
  /** Site targeting: shown after planting on these sites. */
  siteAssignment: SiteAssignment
  /** Site uids targeted when `siteAssignment === 'specific'`. */
  siteIds: string[]
  /** Intervention-type targeting. */
  interventionAssignment: InterventionAssignment
  /** Intervention type values targeted when `interventionAssignment === 'specific'`. */
  interventionTypes: string[]
  sections: FormSection[]
  createdAt: string
  updatedAt: string
}

/** A field that has selectable options (dropdown, radio, checkbox). */
export type ChoiceField = Extract<FormField, { config: ChoiceConfig }>

export function isChoiceField(field: FormField): field is ChoiceField {
  return field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox'
}
