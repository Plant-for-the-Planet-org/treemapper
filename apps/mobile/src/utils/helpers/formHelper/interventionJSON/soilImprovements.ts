import { FormElement, MainForm } from 'src/types/interface/form.interface'
import { RegisterFormSliceInitialState } from 'src/types/interface/slice.interface'
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

const Fertilizer: FormElement = {
    index: 0,
    key: 'fertilizer',
    label: 'Fertilizer',
    default: '',
    type: 'INPUT',
    placeholder: 'Amount of fertilizer',
    unit: 'kg',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: true,
    validation: "^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|100000)$"
}


const soilImprovementForm: MainForm = {
    title: 'More Details',
    key: '',
    elements: [Fertilizer, Description],
}

export const SoilImprovements: RegisterFormSliceInitialState = {
    ...initialInterventionState,
    title: 'Soil Improvement',
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
    can_be_entire_site: true,
    form_details: [soilImprovementForm],
    entire_site_selected: false,
    key: 'soil-improvement',
    should_register_location: false,
}