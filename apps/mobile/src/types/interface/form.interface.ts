import { KeyboardType } from 'react-native'
import { DATA_VISIBILITY, FORM_TYPE } from '../type/app.type'




export interface FormElement {
  element_id?: string;
  index?: number
  key: string
  value: string
  label: string
  default?: string
  type?: FORM_TYPE
  placeholder?: string
  unit: string
  visibility: DATA_VISIBILITY
  condition?: { [key: string]: boolean } | null
  data_type?: 'number' | 'string' | 'boolean'
  keyboard_type: KeyboardType
  sub_form?: FormElement | null
  editable?: boolean
  required?: boolean
  validation?: string
  dropDownData?: string,
  intervention?: string[];
  isFormData?: boolean,
  title?: string
}

export interface MainForm {
  title: string
  key: string
  elements: FormElement[]
}

