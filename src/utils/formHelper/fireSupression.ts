// import {FormElement, MainForm} from 'src/types/interface/form.interface'
import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'

const TeamName: FormElement = {
  index: 0,
  key: 'team-name',
  label: 'Name',
  default: '',
  type: 'INPUT',
  placeholder: 'Name',
  unit: '',
  visibility: 'public',
  condition: null,
  data_type: 'string',
  keyboard_type: 'default',
  sub_form: undefined,
  editable: true
}

const NumberOfMembers: FormElement = {
  index: 0,
  key: 'number-of-member',
  label: 'Number Of Member',
  default: '',
  type: 'INPUT',
  placeholder: 'Number of Members',
  unit: '',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'numeric',
  sub_form: undefined,
  editable: true
}

// const TagIdSwitch: FormElement = {
//   index: 0,
//   key: 'is-tree-tagged',
//   label: 'This tree has been tagged for identification',
//   default: 'false',
//   type: 'SWITCH',
//   placeholder: '',
//   unit: '',
//   visibility: 'public',
//   condition: null,
//   data_type: 'boolean',
//   keyboard_type: 'default',
//   sub_form: undefined,
//   editable: true
// }

// const TagId: FormElement = {
//   index: 0,
//   key: 'tag-id',
//   label: 'Tag Id',
//   default: '',
//   type: 'INPUT',
//   placeholder: 'Tag id',
//   unit: '',
//   visibility: 'public',
//   condition: {
//     'is-tree-tagged': true,
//   },
//   data_type: 'number',
//   keyboard_type: 'default',
//   sub_form: undefined,
//   editable: true
// }

const fireSupressionForm: MainForm = {
  title: 'Team Details',
  key: '',
  elements: [TeamName, NumberOfMembers],
}

export const fireSupressionFormData: RegisterFormSliceInitalState = {
  form_id: '',
  key: 'fire-suppression',
  title: 'Fire Suppression',
  intervention_date: 0,
  skip_intervention_form: false,
  project_id: '',
  site_id: '',
  entire_site_intervention: false,
  location_type: 'Point',
  location_title: 'Team Location',
  coordinates: [],
  preview_blank_polygon: false,
  cover_image_required: true,
  cover_image_url: '',
  cover_image_id: '',
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  species_modal_message: 'did you plant?',
  species_modal_unit: 'Tree Count',
  species: [],
  has_sample_trees: false,
  tree_details_required: false,
  tree_image_required: false,
  tree_details: [],
  form_details: [fireSupressionForm],
  user_type: '',
  project_name: '',
  site_name: '',
  tree_image_url: '',
  meta_data: '',
  intervention_type: 'FIRESUPRESSION_TEAM',
  form_data: []
}
