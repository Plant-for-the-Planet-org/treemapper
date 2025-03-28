import { RegisterFormSliceInitialState } from "src/types/interface/slice.interface";

export const initialInterventionState:RegisterFormSliceInitialState= {
    form_id: '',
    key: 'unknown',
    title: '',
    intervention_date: 0,
    skip_intervention_form: false,
    user_type: '',
    project_id: '',
    project_name: '',
    site_id: '',
    site_name: '',
    can_be_entire_site: false,
    entire_site_selected: false,
    should_register_location: false,
    location_type: 'Point',
    location_title: '',
    coordinates: [],
    preview_blank_polygon: false,
    cover_image_url: '',
    species_required: false,
    is_multi_species: false,
    species_count_required: false,
    species_modal_message: '',
    species_modal_unit: '',
    species: [],
    has_sample_trees: false,
    tree_details_required: false,
    tree_details: [],
    form_details: [],
    meta_data: '{}',
    additional_data: [],
    form_data: [],
    plantedSpecies: []
  }