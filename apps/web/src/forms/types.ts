export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'signature'
  | 'slider'
  | 'rating'

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

export interface SliderConfig {
  min: number
  max: number
  step: number
  showValue: boolean
}

export interface RatingConfig {
  maxRating: number
  icon: 'star' | 'heart' | 'thumbs'
}

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

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder: string
  helpText: string
  required: boolean
  options: FieldOption[]
  textConfig: TextConfig
  numberConfig: NumberConfig
  dateConfig: DateConfig
  sliderConfig: SliderConfig
  ratingConfig: RatingConfig
  conditions: ConditionalRule[]
}

export interface FormSection {
  id: string
  title: string
  description: string
  fields: FormField[]
  collapsed: boolean
}

export interface Form {
  id: string
  name: string
  description: string
  projectId: string
  status: 'draft' | 'published'
  sections: FormSection[]
  createdAt: string
  updatedAt: string
}
