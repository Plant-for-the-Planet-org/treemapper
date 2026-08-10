import { FormElement, MainForm } from 'src/types/interface/form.interface'
import { RegisterFormSliceInitialState } from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'





const NumberOfBirdPerch: FormElement = {
  index: 0,
  key: 'number-of-bird-perch',
  label: 'Number of bird perch',
  default: '',
  type: 'INPUT',
  placeholder: 'Number of bird perch',
  unit: 'Bird Perches',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'number-pad',
  sub_form: undefined,
  editable: true,
  value: '',
  required: true,
  dropDownData: '',
  validation: "^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
}

const heightOfBirdPerch: FormElement = {
  index: 0,
  key: 'height-of-bird-perch',
  label: 'Average Height of perch',
  default: '',
  type: 'INPUT',
  placeholder: 'Average Height of perch (optional)',
  unit: 'm',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'number-pad',
  sub_form: undefined,
  editable: true,
  value: '',
  required: false,
  dropDownData: '',
  validation: "^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
}


const assistingSeedRainForm: MainForm = {
  title: 'Bird Perch Details',
  key: '',
  elements: [NumberOfBirdPerch, heightOfBirdPerch],
}

export const AssistingSeedRain: RegisterFormSliceInitialState = {
  ...initialInterventionState,
  title: 'Assisting Seed Rain',
  skip_intervention_form: false,
  user_type: 'normal',
  location_type: 'Polygon',
  location_title: 'Select Location',
  preview_blank_polygon: true,
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  tree_details_required: false,
  has_sample_trees: false,
  form_details: [assistingSeedRainForm],
  can_be_entire_site: true,
  entire_site_selected: false,
  key: 'assisting-seed-rain',
  should_register_location: false,
}