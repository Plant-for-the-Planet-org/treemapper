import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'


const NumberOfPeople: FormElement = {
  index: 0,
  key: 'number-of-people-involved',
  label: 'Number Of People Involved',
  default: '',
  type: 'INPUT',
  placeholder: 'Number of People Involved',
  unit: '',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'numeric',
  sub_form: undefined,
  editable: true,
  value: '',
  required: true,
  validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
}
  
  const WorkingHours: FormElement = {
    index: 0,
    key: 'working-hours',
    label: 'Working Hours',
    default: '',
    type: 'INPUT',
    placeholder: 'Number of hours',
    unit: 'hrs',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'numeric',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true,
    validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
  }
  
  

const firePatrolForm: MainForm = {
    title: 'Team Details',
    key: '',
    elements: [NumberOfPeople, WorkingHours, ],
  }
  

export const FirePatrol: RegisterFormSliceInitalState = {
  form_id: '',
  key: 'fire-patrol',
  title: 'Fire Patrol',
  intervention_date: 0,
  skip_intervention_form: false,
  user_type: '',
  project_id: '',
  project_name: '',
  site_id: '',
  site_name: '',
  can_be_entire_site: true,
  entire_site_selected: false,
  should_register_location: false,
  location_type: 'Polygon',
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
  form_details: [firePatrolForm],
  meta_data: '{}',
  additional_data: '',
  form_data: [],
  plantedSpecies: []
}