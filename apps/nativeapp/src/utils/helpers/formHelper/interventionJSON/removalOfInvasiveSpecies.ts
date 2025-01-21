import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


export const RemovalOfInvasiveSpecies: RegisterFormSliceInitialState = {
    ...initialInterventionState,
    title: 'Removal of Invasive Species',
    skip_intervention_form: false,
    location_type: 'Polygon',
    location_title: 'Select Location',
    preview_blank_polygon: true,
    species_required: true,
    is_multi_species: true,
    species_count_required: false,
    tree_details_required: true,
    has_sample_trees: false,
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'removal-invasive-species',
    should_register_location: false,
}
