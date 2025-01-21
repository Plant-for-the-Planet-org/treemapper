import { FormElement, MainForm } from 'src/types/interface/form.interface'
import {RegisterFormSliceInitialState} from 'src/types/interface/slice.interface'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'


const WidthOfStrip: FormElement = {
  index: 0,
  key: 'width-of-strip',
  label: 'Width of strip',
  default: '',
  type: 'INPUT',
  placeholder: 'Width of strip',
  unit: 'm',
  visibility: 'public',
  condition: null,
  data_type: 'number',
  keyboard_type: 'number-pad',
  sub_form: undefined,
  editable: true,
  value: '',
  required: true,
  validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
}
  const MinWidth: FormElement = {
    index: 0,
    key: 'min-width-of-strip',
    label: 'Minimum width Of strip',
    default: '',
    type: 'INPUT',
    placeholder: 'Minimum width Of strip (Optional)',
    unit: 'm',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: false,
    validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
  }
  
  const MaxWidth: FormElement = {
    index: 0,
    key: 'max-width-of-strip',
    label: 'Maximum width Of strip',
    default: '',
    type: 'INPUT',
    placeholder: 'Maximum width Of strip (Optional)',
    unit: 'm',
    visibility: 'public',
    condition: null,
    data_type: 'number',
    keyboard_type: 'number-pad',
    sub_form: undefined,
    editable: true,
    value: '',
    required: false,
    validation:"^(?!0$)(?!0\\d)\\d{1,2}$|^(?:1\\d\\d|200)$"
  }
  
  const firebreaksForm: MainForm = {
    title: 'Firebreak Details',
    key: '',
    elements: [WidthOfStrip, MinWidth, MaxWidth ],
  }
  
  

export const FireBreaks: RegisterFormSliceInitialState = {
  ...initialInterventionState,
  title: 'Establish FireBreaks',
  skip_intervention_form: false,
  user_type: 'normal',
  location_type: 'Polygon',
  location_title: 'Mark Firebreak',
  preview_blank_polygon: true,
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  tree_details_required: false,
  has_sample_trees: false,
  form_details: [firebreaksForm],
  can_be_entire_site: false,
  entire_site_selected: false,
  key: 'firebreaks',
  should_register_location: false,
}