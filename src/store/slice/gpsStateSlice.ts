import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GpsSliceInitalState } from 'src/types/interface/slice.interface'

const initialState: GpsSliceInitalState = {
  user_location: [],
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
    updaeBlockerModal(state, action: PayloadAction<boolean>) {
      state.showBlockerModal = action.payload
    },
    updateAccurracy(state, action: PayloadAction<number>) {
      state.accuracy = action.payload
    },
  },
})

export const { updateUserLocation, updaeBlockerModal, updateAccurracy } = gpsStateSlice.actions

export default gpsStateSlice.reducer
