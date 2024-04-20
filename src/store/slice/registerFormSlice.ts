import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {
  FormValues,
  RegisterFormSliceInitalState,
  SampleTree,
} from 'src/types/interface/slice.interface'

export const initialState: RegisterFormSliceInitalState = {
  form_id: '',
  key: 'single-tree-registration',
  title: '',
  intervention_date: 0,
  skip_intervention_form: false,
  project_id: '',
  site_id: '',
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
  tree_details_required: false,
  has_sample_trees: false,
  tree_details: [],
  form_details: [],
  user_type: 'tpo',
  project_name: '',
  site_name: '',
  meta_data: '',
  form_data: [],
  additional_data: '',
  can_be_entire_site: false,
  entire_site_selected: false,
}

const registerFormSlice = createSlice({
  name: 'registerFormSlice',
  initialState,
  reducers: {
    initiateForm(_state, action: PayloadAction<RegisterFormSliceInitalState>) {
      return {...action.payload}
    },
    updateFormCoordinates(state, action: PayloadAction<Array<number[]>>) {
      state.coordinates = action.payload
    },
    updateCoverImageURL(state, action: PayloadAction<string>) {
      state.cover_image_url = action.payload
    },
    updateFormSpecies(state, action: PayloadAction<string>) {
      state.species = [...state.species, action.payload]
    },
    updateTree_details(state, action: PayloadAction<SampleTree>) {
      state.tree_details = [...state.tree_details, action.payload]
    },
    updateFormDataValue(state, action: PayloadAction<FormValues[]>) {
      state.form_data = [...state.form_data, ...action.payload]
    },
    updateFormProject(
      state,
      action: PayloadAction<{name: string; id: string}>,
    ) {
      state.project_name = action.payload.name
      state.project_id = action.payload.id
    },
    updateFormProjectSite(
      state,
      action: PayloadAction<{name: string; id: string}>,
    ) {
      state.site_name = action.payload.name
      state.site_id = action.payload.id
    },
    updteInterventionDate(state, action: PayloadAction<number>) {
      state.intervention_date = action.payload
    },
    updateEntireSiteIntervention(state, action: PayloadAction<boolean>) {
      state.entire_site_selected = action.payload
    },
  },
})

export const {
  initiateForm,
  updateFormCoordinates,
  updateCoverImageURL,
  updateFormSpecies,
  updateTree_details,
  updateFormProject,
  updateFormProjectSite,
  updteInterventionDate,
  updateEntireSiteIntervention
} = registerFormSlice.actions

export default registerFormSlice.reducer
