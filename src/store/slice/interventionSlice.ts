import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {InterventionData} from 'src/types/interface/slice.interface'

const initialState: InterventionData = {
  intervention_id: '',
  intervention_key: '',
  intervention_title: '',
  intervention_date: 0,
  project_id: '',
  project_name: '',
  site_name: '',
  location_type: '',
  location: {
    type: 'Point',
    coordinates: '',
  },
  cover_image_url: '',
  has_species: false,
  species: [],
  has_sample_trees: false,
  sample_trees: [],
  is_complete: false,
  site_id: '',
  intervention_type: 'SINGLE_TREE',
  form_data: '',
  additional_data: '',
  meta_data: '',
}

const interventionSlice = createSlice({
  name: 'interventionSlice',
  initialState,
  reducers: {
    updateInerventionData(_state, action: PayloadAction<InterventionData>) {
      return {...action.payload}
    },
  },
})

export const {updateInerventionData} = interventionSlice.actions

export default interventionSlice.reducer
