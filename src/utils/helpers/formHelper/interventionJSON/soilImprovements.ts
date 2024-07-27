import { RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'



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
    meta_data: '{}',
    form_data: [],
    additional_data: [],
    can_be_entire_site: true,
    entire_site_selected: false,
    key: 'soil-improvement',
    should_register_location: false,
    plantedSpecies: []
}