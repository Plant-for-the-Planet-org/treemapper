// import { FormElement, MainForm } from 'src/types/interface/form.interface'
import { RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'


// const FertilizerQuanity: FormElement = {
//     index: 0,
//     key: 'fertilizer-quantity',
//     label: 'Fertilizer Quantity',
//     default: '',
//     type: 'INPUT',
//     placeholder: 'Fertilizer Quantity',
//     unit: 'kg',
//     visibility: 'public',
//     condition: null,
//     data_type: 'number',
//     keyboard_type: 'number-pad',
//     sub_form: undefined,
//     editable: true,
//     value: '',
//     required: true,
//     dropDownData: []
// }

// const heightOfBirdPerche: FormElement = {
//     index: 0,
//     key: 'height-of-bird-perche',
//     label: 'Height of bird perche',
//     default: '',
//     type: 'INPUT',
//     placeholder: 'Height of bird perche',
//     unit: '',
//     visibility: 'public',
//     condition: null,
//     data_type: 'number',
//     keyboard_type: 'number-pad',
//     sub_form: undefined,
//     editable: true,
//     value: '',
//     required: true,
//     dropDownData: []
// }


// const soildImprovementForm: MainForm = {
//   title: 'Dettails',
//   key: '',
//   elements: [NumberOfBirdPerche, heightOfBirdPerche ],
// }

export const SoilImprovements: RegisterFormSliceInitalState = {
    form_id: '',
    title: 'Soil Improvement',
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
    form_details: [],
    meta_data: '',
    form_data: [],
    additional_data: '',
    can_be_entire_site: false,
    entire_site_selected: false,
    key: 'soil-improvement',
    should_register_location: false
}