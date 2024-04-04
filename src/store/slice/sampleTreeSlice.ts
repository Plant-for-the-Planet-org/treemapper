import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import {SampleTreeSlice} from 'src/types/interface/slice.interface'

const initialState: SampleTreeSlice = {
  form_id: '',
  tree_details: [],
  species: [],
  sample_tree_count: 0,
  move_next_primary: '',
  move_next_secondary: '',
}

const sampleTreeSlice = createSlice({
  name: 'sampleTreeSlice',
  initialState,
  reducers: {
    updateSampleTreeFormId(state, action: PayloadAction<string>) {
      state.form_id = action.payload
    },
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
  },
})

export const {updateSampleTreeFormId, addSampleTreeSpecies} = sampleTreeSlice.actions

export default sampleTreeSlice.reducer
