import { FormElement, MainForm } from 'src/types/interface/form.interface'
import { RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'




// const BirdPercheType: FormElement = {
//     index: 0,
//     key: 'bird-perche-type',
//     label: 'Type of ',
//     default: '',
//     type: 'DROPDOWN',
//     placeholder: 'Width ff strip',
//     unit: 'm',
//     visibility: 'public',
//     condition: null,
//     data_type: 'number',
//     keyboard_type: 'number-pad',
//     sub_form: undefined,
//     editable: true,
//     value: '',
//     required: true
//   }

  const NumberOfBirdPerche: FormElement = {
    index: 0,
    key: 'number-of-bird-perche',
    label: 'Number of bird perche',
    default: '',
    type: 'INPUT',
    placeholder: 'Number of bird perche',
    unit: '',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true,
    dropDownData: [],
    validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"    
  }
  
  const heightOfBirdPerche: FormElement = {
    index: 0,
    key: 'height-of-bird-perche',
    label: 'Average Height of bird perche',
    default: '',
    type: 'INPUT',
    placeholder: 'Average Height of bird perche',
    unit: '',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true,
    dropDownData: [],
    validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
  }
  
  
  const assistingSeedRainForm: MainForm = {
    title: 'Bird Perche Details',
    key: '',
    elements: [NumberOfBirdPerche, heightOfBirdPerche ],
  }

export const AssistingSeedRain: RegisterFormSliceInitalState = {
    form_id: '',
    title: 'Assisting Seed Rain',
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
    form_details: [assistingSeedRainForm],
    meta_data: '',
    form_data: [],
    additional_data: '',
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'assisting-seed-rain',
    should_register_location: false
}