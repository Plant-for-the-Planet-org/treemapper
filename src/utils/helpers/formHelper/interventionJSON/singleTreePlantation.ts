import { RegisterFormSliceInitialState } from 'src/types/interface/slice.interface'
import i18next from 'src/locales/index'
import { interventionHeader } from '../../interventionHelper/interventionLocaleHelper'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


export const SingleTeePlantation: RegisterFormSliceInitialState = {
  ...initialInterventionState,
  key: 'single-tree-registration',
  title: interventionHeader('single-tree-registration'),
  skip_intervention_form: true,
  user_type: 'normal',
  should_register_location: false,
  location_type: 'Point',
  location_title: i18next.t('label.tree_location'),
  preview_blank_polygon: false,
  species_required: true,
  is_multi_species: false,
  species_count_required: false,
  tree_details_required: true,
  has_sample_trees: false,
  can_be_entire_site: false,
  entire_site_selected: false,
}
