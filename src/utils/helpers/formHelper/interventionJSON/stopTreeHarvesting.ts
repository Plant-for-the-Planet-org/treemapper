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

const TreesSaved: FormElement = {
    index: 0,
    key: 'number-of-trees-saved',
    label: 'Number of saved trees',
    default: '',
    type: 'INPUT',
    placeholder: 'Number of saved trees',
    unit: 'saved trees',
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




const savedForm: MainForm = {
    title: 'More Details',
    key: '',
    elements: [TreesSaved, Description],
}



export const StopTreeHarvesting: RegisterFormSliceInitialState = {
    ...initialInterventionState,
    title: 'Stop Tree Harvesting',
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
    form_details: [savedForm],
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'stop-tree-harvesting',
    should_register_location: false,
}