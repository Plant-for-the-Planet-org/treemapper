import { KeyboardType } from 'react-native'
import { DATA_VISIBLITY, FORM_TYPE } from '../type/app.type'
import { DropdownData } from './app.interface'




export interface FormElement {
  element_id?: string;
  index: number
  key: string
  value: string
  label: string
  default: string
  type: FORM_TYPE
  placeholder: string
  unit: string
  visibility: DATA_VISIBLITY
  condition?: { [key: string]: boolean } | null
  data_type: 'number' | 'string' | 'boolean'
  keyboard_type: KeyboardType
  sub_form?: FormElement | null
  editable: boolean
  required: boolean
  validation: string
  dropDownData?: DropdownData[],
  intervention?: string[];

}

export interface MainForm {
  title: string
  key: string
  elements: FormElement[]
}

