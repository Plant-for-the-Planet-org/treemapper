import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {Coordinates} from 'src/types/interface/app.interface'
import {
  FormSpecies,
  RegisterFormSliceInitalState,
} from 'src/types/interface/slice.interface'

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
  species: [],
  form_details: []
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
    updateFormSpecies(state, action: PayloadAction<FormSpecies>) {
      state.species = [...state.species, action.payload]
    },
  },
})

export const {
  initiateForm,
  updateFormCoordinates,
  updateCoverImageId,
  updateCoverImageURL,
  updateFormSpecies
} = registerFormSlice.actions

export default registerFormSlice.reducer
