import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


export const MarkingRegenerant: RegisterFormSliceInitialState = {
    ...initialInterventionState,
    title: 'Marking Regenerant',
    skip_intervention_form: false,
    user_type: 'normal',
    location_type: 'Polygon',
    location_title: 'Select Location',
    preview_blank_polygon: true,
    species_required: true,
    is_multi_species: true,
    species_count_required: true,
    tree_details_required: true,
    has_sample_trees: true,
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'marking-regenerant',
    should_register_location: false,
}