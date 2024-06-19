import { FormElement, MainForm } from 'src/types/interface/form.interface'
import { RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'


const Description: FormElement = {
  index: 0,
  key: 'description',
  label: 'Description',
  default: '',
  type: 'TEXTAREA',
  placeholder: 'Description',
  unit: '',
  visibility: 'public',
  condition: null,
  data_type: 'string',
  keyboard_type: 'default',
  sub_form: undefined,
  editable: true,
  value: '',
  required: false,
  validation: ".+"
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

const maintenanceForm: MainForm = {
  title: 'Details',
  key: '',
  elements: [Description],
}


export const Maintenance: RegisterFormSliceInitalState = {
  form_id: '',
  title: 'Maintenance',
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
  form_details: [maintenanceForm],
  meta_data: '{}',
  form_data: [],
  additional_data: [],
  can_be_entire_site: false,
  entire_site_selected: false,
  key: 'maintenance',
  should_register_location: false,
  plantedSpecies: [],
  optionalLocation: true
}