import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SyncInfoData, TempStateSlice } from 'src/types/interface/slice.interface'

const initialState: TempStateSlice = {
  webAuthLoading: false,
  synData: []
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
  },
})

export const { updateWebAuthLoading, initSyncData } = tempStateSlice.actions

export default tempStateSlice.reducer
