import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {
  Coordinates,
  IScientificSpecies,
} from 'src/types/interface/app.interface'
import {SampleTreeSlice} from 'src/types/interface/slice.interface'

const initialState: SampleTreeSlice = {
  form_id: '',
  species: [],
  sample_tree_count: 2,
  move_next_primary: '',
  move_next_secondary: '',
  boundry: [],
  coordinates: [],
  image_url: '',
  current_species: '',
}

const sampleTreeSlice = createSlice({
  name: 'sampleTreeSlice',
  initialState,
  reducers: {
    addSampleTreeSpecies(
      state,
      action: PayloadAction<{item: IScientificSpecies; count: number}>,
    ) {
      state.species = [
        ...state.species,
        {
          info: action.payload.item,
          count: action.payload.count,
        },
      ]
    },
    updateBoundry(
      state,
      action: PayloadAction<{coord: Coordinates[]; id: string}>,
    ) {
      state.boundry = action.payload.coord
      state.form_id = action.payload.id
    },
    updateSampleTreeCoordinates(state, action: PayloadAction<Coordinates[]>) {
      state.coordinates = action.payload
    },
    updateSampleImageUrl(state, action: PayloadAction<string>) {
      state.image_url = action.payload
    },
    updateCurrentSpecies(state, action: PayloadAction<string>) {
      state.current_species = action.payload
    },
    updateSampleTreeForNextTree(state) {
      state.sample_tree_count = state.sample_tree_count - 1
    },
    resetSampleTreeform(){
      return {...initialState}
    }
  },
})

export const {
  addSampleTreeSpecies,
  updateBoundry,
  updateSampleTreeCoordinates,
  updateSampleImageUrl,
  updateCurrentSpecies,
  updateSampleTreeForNextTree,
  resetSampleTreeform
} = sampleTreeSlice.actions

export default sampleTreeSlice.reducer
