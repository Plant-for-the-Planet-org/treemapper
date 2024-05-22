import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PlantedSpecies, SampleTreeSlice } from 'src/types/interface/slice.interface'

const initialState: SampleTreeSlice = {
  form_id: '',
  sample_tree_count: 2,
  move_next_primary: '',
  move_next_secondary: '',
  boundry: [],
  coordinates: [],
  image_url: '',
  current_species: {
    guid: '',
    scientific_name: '',
    aliases: '',
    count: 0,
    image:''
  },
}

const sampleTreeSlice = createSlice({
  name: 'sampleTreeSlice',
  initialState,
  reducers: {
    updateBoundry(
      state,
      action: PayloadAction<{ coord: Array<number[]>; id: string }>,
    ) {
      state.boundry = action.payload.coord
      state.form_id = action.payload.id
    },
    updateSampleTreeCoordinates(state, action: PayloadAction<Array<number[]>>) {
      state.coordinates = action.payload
    },
    updateSampleImageUrl(state, action: PayloadAction<string>) {
      state.image_url = action.payload
    },
    updateCurrentSpecies(state, action: PayloadAction<PlantedSpecies>) {
      state.current_species = action.payload
    },
    updateSampleTreeForNextTree(state) {
      state.sample_tree_count = state.sample_tree_count - 1
    },
    updateSingleTreeDetails(_state, action: PayloadAction<SampleTreeSlice>) {
      return {...action.payload}
    },
    resetSampleTreeform() {
      return { ...initialState }
    }
  },
})

export const {
  updateBoundry,
  updateSampleTreeCoordinates,
  updateSampleImageUrl,
  updateCurrentSpecies,
  updateSampleTreeForNextTree,
  resetSampleTreeform,
  updateSingleTreeDetails
} = sampleTreeSlice.actions

export default sampleTreeSlice.reducer
