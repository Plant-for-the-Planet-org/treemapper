import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SyncInfoData, TempStateSlice } from 'src/types/interface/slice.interface'

const initialState: TempStateSlice = {
  webAuthLoading: false,
  synData: [],
  selectedId: '',
  speciesDownloading: false,
  speciesWriting: false,
  speciesUpdatedAt: 0
}

const tempStateSlice = createSlice({
  name: 'tempStateSlice',
  initialState,
  reducers: {
    updateWebAuthLoading(state, action: PayloadAction<boolean>) {
      state.webAuthLoading = action.payload
    },
    initSyncData(state, action: PayloadAction<SyncInfoData[]>) {
      state.synData = action.payload
    },
    updateSelectedSpeciesId(state, action: PayloadAction<string>) {
      state.selectedId = action.payload
    },
    updateSpeciesDownloading(state, action: PayloadAction<boolean>) {
      state.speciesDownloading = action.payload
    },
    updateSpeciesUpdatedAt(state) {
      state.speciesUpdatedAt = Date.now()
    },
  },
})

export const { updateWebAuthLoading, initSyncData, updateSelectedSpeciesId, updateSpeciesDownloading, updateSpeciesUpdatedAt } = tempStateSlice.actions

export default tempStateSlice.reducer
