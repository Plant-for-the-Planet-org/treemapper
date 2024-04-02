import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {Coordinates} from 'src/types/interface/app.interface'
import {RegisterFormSliceInitalState, SampleTree} from 'src/types/interface/slice.interface'

export const initialState: RegisterFormSliceInitalState = {
  form_id: '',
  key: '',
  title: '',
  location_type: 'Point',
  location_title: '',
  coordinates: [],
  cover_image_required: false,
  cover_image_id: '',
  cover_image_url: '',
  species_required: false,
  tree_details: [],
  form_details: [],
  has_sample_trees: false,
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
    updateFormSpecies(state, action: PayloadAction<SampleTree>) {
      state.tree_details = [...state.tree_details, action.payload]
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
