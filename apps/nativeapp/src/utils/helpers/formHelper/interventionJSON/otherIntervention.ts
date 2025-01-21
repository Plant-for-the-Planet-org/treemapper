import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


const Description: FormElement = {
  index: 0,
  key: 'extra-info',
  label: 'More info',
  default: '',
  type: 'TEXTAREA',
  placeholder: 'More info (optional)',
  title: 'More Info',
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

  
  const otherInterventionForm: MainForm = {
    title: 'More Details',
    key: '',
    elements: [Description],
  }

export const OtherIntervention: RegisterFormSliceInitialState = {
  ...initialInterventionState,
  title: 'Other Intervention',
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
  form_details: [otherInterventionForm],
  can_be_entire_site: true,
  entire_site_selected: false,
  key: 'other-intervention',
  should_register_location: false,
  optionalLocation: true
}