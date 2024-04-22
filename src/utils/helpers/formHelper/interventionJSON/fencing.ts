import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'


const Descitption: FormElement = {
    index: 0,
    key: 'description',
    label: 'Describe more about fencing',
    default: '',
    type: 'TEXTAREA',
    placeholder: 'Describe more about fencing',
    unit: '',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'numeric',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true
  }
    
  
  const fencingForm: MainForm = {
      title: 'Team Details',
      key: '',
      elements: [Descitption, ],
    }
    

export const Fencing: RegisterFormSliceInitalState = {
    form_id: '',
    title: 'Fencing',
    intervention_date: 0,
    skip_intervention_form: false,
    user_type: 'normal',
    project_id: '',
    site_id: '',
    site_name: '',
    project_name: '',
    location_type: 'Polygon',
    location_title: 'Mark Fencing',
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
    form_details: [fencingForm],
    meta_data: '',
    form_data: [],
    additional_data: '',
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'fencing',
    should_register_location: false
}