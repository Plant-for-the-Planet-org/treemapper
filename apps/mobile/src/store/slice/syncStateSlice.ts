import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { InterventionData, SampleTree, SyncSlice } from 'src/types/interface/slice.interface'

const initialState: SyncSlice = {
  syncRequired: false,
  isSyncing: false,
  message: '',
  intervention: [],
  species: [],
  sampleTrees: []
}

const syncStateSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    updateSyncRequired(state, action: PayloadAction<boolean>) {
      state.syncRequired = action.payload
    },
    updateSyncDetails(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload
    },
    updateSyncState(state, action: PayloadAction<{ intervention: InterventionData[], sampleTree: SampleTree[], species: IScientificSpecies[] }>) {
      state.intervention = action.payload.intervention
      state.species = action.payload.species
      state.sampleTrees = action.payload.sampleTree
    },
  },
})

export const { updateSyncRequired, updateSyncDetails } = syncStateSlice.actions

export default syncStateSlice.reducer
