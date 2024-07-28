import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


export const GrassSuppression: RegisterFormSliceInitialState = {
    ...initialInterventionState,
    title: 'Grass Suppression',
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
    entire_site_selected: false,
    key: 'grass-suppression',
    should_register_location: false,
}