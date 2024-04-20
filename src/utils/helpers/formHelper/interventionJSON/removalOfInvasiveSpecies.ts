// import {FormElement, MainForm} from 'src/types/interface/form.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'

// const HeightElement: FormElement = {
//   index: 0,
//   key: 'tree-height',
//   label: 'Height',
//   default: '',
//   type: 'INPUT',
//   placeholder: 'Height',
//   unit: 'm',
//   visibility: 'public',
//   condition: null,
//   data_type: 'number',
//   keyboard_type: 'numeric',
//   sub_form: undefined,
//   editable: true,
// }

// const DiamterElement: FormElement = {
//   index: 0,
//   key: 'basal-diameter',
//   label: 'Basal Diameter',
//   default: '',
//   type: 'INPUT',
//   placeholder: 'Basal Diameter',
//   unit: 'cm',
//   visibility: 'public',
//   condition: null,
//   data_type: 'number',
//   keyboard_type: 'numeric',
//   sub_form: undefined,
//   editable: true,
// }

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
//   editable: true,
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
//   editable: true,
// }

// const singleTreeMainForm: MainForm = {
//   title: 'Add Measurments',
//   key: '',
//   elements: [HeightElement, DiamterElement, TagIdSwitch, TagId],
// }

export const removalOfInvasiveSpeciesData: RegisterFormSliceInitalState = {
  form_id: '',
  key: '',
  title: '',
  intervention_type: 'single-tree-registration',
  intervention_date: 0,
  skip_intervention_form: false,
  user_type: '',
  project_id: '',
  project_name: '',
  site_id: '',
  site_name: '',
  can_be_entire_site: false,
  entire_site_selected: false,
  location_type: 'Point',
  location_title: '',
  coordinates: [],
  preview_blank_polygon: false,
  cover_image_url: '',
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  species_modal_message: '',
  species_modal_unit: '',
  species: [],
  has_sample_trees: false,
  tree_details_required: false,
  tree_details: [],
  form_details: [],
  meta_data: '',
  additional_data: '',
  form_data: []
}
