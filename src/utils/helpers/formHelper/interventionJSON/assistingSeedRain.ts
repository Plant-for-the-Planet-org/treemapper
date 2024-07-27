import { FormElement, MainForm } from 'src/types/interface/form.interface'
import { RegisterFormSliceInitialState } from 'src/types/interface/slice.interface'





const NumberOfBirdPerch: FormElement = {
  index: 0,
  key: 'number-of-bird-perch',
  label: 'Number of bird perch',
  default: '',
  type: 'INPUT',
  placeholder: 'Number of bird perch',
  unit: '',
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
  label: 'Average Height of bird perch',
  default: '',
  type: 'INPUT',
  placeholder: 'Average Height of bird perch',
  unit: '',
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


const assistingSeedRainForm: MainForm = {
  title: 'Bird Perch Details',
  key: '',
  elements: [NumberOfBirdPerch, heightOfBirdPerch],
}

export const AssistingSeedRain: RegisterFormSliceInitialState = {
  form_id: '',
  title: 'Assisting Seed Rain',
  intervention_date: 0,
  skip_intervention_form: false,
  user_type: 'normal',
  project_id: '',
  site_id: '',
  site_name: '',
  project_name: '',
  location_type: 'Polygon',
  location_title: 'Select Location',
  coordinates: [],
  preview_blank_polygon: true,
  cover_image_url: '',
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  species_modal_message: '',
  species_modal_unit: '',
  species: [],
  tree_details_required: false,
  has_sample_trees: false,
  tree_details: [],
  form_details: [assistingSeedRainForm],
  meta_data: '{}',
  form_data: [],
  additional_data: [],
  can_be_entire_site: true,
  entire_site_selected: false,
  key: 'assisting-seed-rain',
  should_register_location: false,
  plantedSpecies: []
}