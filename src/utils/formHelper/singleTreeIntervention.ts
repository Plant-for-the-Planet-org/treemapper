import {FormElement, MainForm} from 'src/types/interface/form.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'

const HeightElement: FormElement = {
  index: 0,
  key: 'tree-height',
  label: 'Height',
  default: '',
  type: 'INPUT',
  placeholder: 'Height',
  unit: 'm',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'numeric',
  sub_form: undefined,
  editable: true
}

const DiamterElement: FormElement = {
  index: 0,
  key: 'basal-diameter',
  label: 'Basal Diameter',
  default: '',
  type: 'INPUT',
  placeholder: 'Basal Diameter',
  unit: 'cm',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'numeric',
  sub_form: undefined,
  editable: true
}

const TagIdSwitch: FormElement = {
  index: 0,
  key: 'is-tree-tagged',
  label: 'This tree has been tagged for identification',
  default: 'false',
  type: 'SWITCH',
  placeholder: '',
  unit: '',
  visibility: 'public',
  condition: null,
  data_type: 'boolean',
  keyboard_type: 'default',
  sub_form: undefined,
  editable: true
}

const TagId: FormElement = {
  index: 0,
  key: 'tag-id',
  label: 'Tag Id',
  default: '',
  type: 'INPUT',
  placeholder: 'Tag id',
  unit: '',
  visibility: 'public',
  condition: {
    'is-tree-tagged': true,
  },
  data_type: 'number',
  keyboard_type: 'default',
  sub_form: undefined,
  editable: true
}

const singleTreeMainForm: MainForm = {
  title: 'Add Measurments',
  key: '',
  elements: [HeightElement, DiamterElement, TagIdSwitch, TagId],
}

export const SingleTreeFormData: RegisterFormSliceInitalState = {
  form_id: '',
  key: '',
  location_title: 'Tree Location',
  location_type: 'Point',
  title: '',
  coordinates: [],
  cover_image_required: true,
  cover_image_url: '',
  cover_image_id: '',
  species_required: true,
  species: [],
  form_details: [singleTreeMainForm],
}
