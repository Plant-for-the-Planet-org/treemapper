import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


const Description: FormElement = {
    index: 0,
    key: 'description',
    label: 'Describe more about fencing',
    default: '',
    type: 'TEXTAREA',
    placeholder: 'Describe more about fencing',
    unit: '',
    visibility: 'public',
    condition: null,
    data_type: 'string',
    keyboard_type: 'default',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true,
    validation: ".+"
}
    
  
  const fencingForm: MainForm = {
      title: 'Team Details',
      key: '',
      elements: [Description],
    }
    

export const Fencing: RegisterFormSliceInitialState = {
    ...initialInterventionState,
    title: 'Fencing',
    skip_intervention_form: false,
    user_type: 'normal',
    location_type: 'Polygon',
    location_title: 'Mark Fencing',
    preview_blank_polygon: true,
    species_required: false,
    is_multi_species: false,
    species_count_required: false,
    tree_details_required: false,
    has_sample_trees: false,
    form_details: [fencingForm],
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'fencing',
    should_register_location: false,
}