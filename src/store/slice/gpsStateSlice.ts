import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GpsSliceInitialState } from 'src/types/interface/slice.interface'

const initialState: GpsSliceInitialState = {
  user_location: [0, 0],
  showBlockerModal: false,
  accuracy: 0
}

const gpsStateSlice = createSlice({
  name: 'gpsSlice',
  initialState,
  reducers: {
    updateUserLocation(state, action: PayloadAction<number[]>) {
      state.user_location = [...action.payload]
    },
    updateBlockerModal(state, action: PayloadAction<boolean>) {
      state.showBlockerModal = action.payload
    },
    updateAccuracy(state, action: PayloadAction<number>) {
      state.accuracy = action.payload
    },
  },
})

export const { updateUserLocation, updateBlockerModal, updateAccuracy } = gpsStateSlice.actions

export default gpsStateSlice.reducer
