import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


export const MultiTreePlantation: RegisterFormSliceInitialState = {
  ...initialInterventionState,
  key: 'multi-tree-registration',
  title: 'Multi Tree Plantation',
  skip_intervention_form: true,
  location_type: 'Polygon',
  location_title: 'Select Location',
  preview_blank_polygon: true,
  species_required: true,
  is_multi_species: true,
  species_count_required: true,
  tree_details_required: true,
  has_sample_trees: true,
  can_be_entire_site: false,
  entire_site_selected: false,
  should_register_location: false,
}
