import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


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
  validation: "^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$",
  element_id: '',
  dropDownData: '',
  intervention: []
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
    validation: "^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$",
    element_id: '',
    dropDownData: '',
    intervention: []
  }
  
  

const firePatrolForm: MainForm = {
    title: 'Team Details',
    key: '',
    elements: [NumberOfPeople, WorkingHours, ],
  }
  

export const FirePatrol: RegisterFormSliceInitialState = {
  ...initialInterventionState,
  key: 'fire-patrol',
  title: 'Fire Patrol',
  location_title: 'Select Location',
  can_be_entire_site: true,
  entire_site_selected: false,
  should_register_location: false,
  location_type: 'Polygon',
  preview_blank_polygon: false,
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  has_sample_trees: false,
  tree_details_required: false,
  form_details: [firePatrolForm]
}