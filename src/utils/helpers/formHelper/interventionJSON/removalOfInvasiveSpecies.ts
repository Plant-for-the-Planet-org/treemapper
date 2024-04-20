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
  key: 'removal-of-invasive-species',
  title: 'Removal Of Invasive Species',
  intervention_date: 0,
  skip_intervention_form: false,
  user_type: 'normal',
  project_id: '',
  site_id: '',
  entire_site_intervention: true,
  location_type: 'Polygon',
  location_title: 'Select Area',
  coordinates: [],
  preview_blank_polygon: true,
  cover_image_required: true,
  cover_image_url: '',
  cover_image_id: '',
  species_required: true,
  is_multi_species: true,
  species_count_required: false,
  species_modal_message: '',
  species_modal_unit: '',
  species: [],
  tree_details_required: false,
  has_sample_trees: false,
  tree_image_required: false,
  tree_details: [],
  form_details: [],
  project_name: '',
  site_name: '',
  tree_image_url: '',
  meta_data: '',
  intervention_type: 'REMOVAL_INVASIVE_SPEICES',
  form_data: []
}
