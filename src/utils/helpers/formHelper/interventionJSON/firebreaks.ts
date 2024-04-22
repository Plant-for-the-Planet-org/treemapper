import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'


const WidthOfStrip: FormElement = {
    index: 0,
    key: 'width-of-strip',
    label: 'Width of strip',
    default: '',
    type: 'INPUT',
    placeholder: 'Width of strip',
    unit: 'm',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true
  }
  const MinWidth: FormElement = {
    index: 0,
    key: 'min-width-of-strip',
    label: 'Minimum width Of strip',
    default: '',
    type: 'INPUT',
    placeholder: 'Minimum width Of strip',
    unit: 'm',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true
  }
  
  const MaxWidth: FormElement = {
    index: 0,
    key: 'max-width-of-strip',
    label: 'Maximum width Of strip',
    default: '',
    type: 'INPUT',
    placeholder: 'Maximum width Of strip',
    unit: 'm',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true
  }
  
  const firebreaksForm: MainForm = {
    title: 'Firebreak Strip Details',
    key: '',
    elements: [WidthOfStrip, MinWidth, MaxWidth ],
  }
  
  

export const FireBreaks: RegisterFormSliceInitalState = {
    form_id: '',
    title: 'Establish FireBreaks',
    intervention_date: 0,
    skip_intervention_form: false,
    user_type: 'normal',
    project_id: '',
    site_id: '',
    site_name: '',
    project_name: '',
    location_type: 'Polygon',
    location_title: 'Mark Firebreak',
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
    form_details: [firebreaksForm],
    meta_data: '',
    form_data: [],
    additional_data: '',
    can_be_entire_site: false,
    entire_site_selected: false,
    key: 'firebreaks',
    should_register_location: false
}