import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {Coordinates} from 'src/types/interface/app.interface'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'

export const initialState: RegisterFormSliceInitalState = {
  form_id: '',
  key: '',
  title: '',
  intervention_date: '',
  skip_intervention_form: false,
  project_id: '',
  site_id: '',
  entire_site_intervention: false,
  location_type: 'Point',
  location_title: '',
  coordinates: [],
  preview_blank_polygon:false,
  cover_image_required: false,
  cover_image_url: '',
  cover_image_id: '',
  species_required: false,
  is_multi_species: false,
  species_count_required: false,
  species_modal_message: '',
  species_modal_unit: '',
  species: [],
  tree_details_required: false,
  has_sample_trees: false,
  tree_image_required: false,
  tree_details: [],
  form_details: [],
}

const registerFormSlice = createSlice({
  name: 'registerFormSlice',
  initialState,
  reducers: {
    initiateForm(_state, action: PayloadAction<RegisterFormSliceInitalState>) {
      return {...action.payload}
    },
    updateFormCoordinates(state, action: PayloadAction<Coordinates[]>) {
      state.coordinates = action.payload
    },
    updateCoverImageId(state, action: PayloadAction<string>) {
      state.cover_image_id = action.payload
    },
    updateCoverImageURL(state, action: PayloadAction<string>) {
      state.cover_image_url = action.payload
    },
    updateFormSpecies(state, action: PayloadAction<string>) {
      state.species = [...state.species, action.payload]
    },
  },
})

export const {
  initiateForm,
  updateFormCoordinates,
  updateCoverImageId,
  updateCoverImageURL,
  updateFormSpecies,
} = registerFormSlice.actions

export default registerFormSlice.reducer
