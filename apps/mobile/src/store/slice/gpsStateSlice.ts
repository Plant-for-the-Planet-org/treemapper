import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GpsSliceInitialState, LocationPermissionStatus } from 'src/types/interface/slice.interface'

const initialState: GpsSliceInitialState = {
  user_location: [0, 0],
  accuracy: 0,
  permission_status: 'undetermined'
}

const gpsStateSlice = createSlice({
  name: 'gpsSlice',
  initialState,
  reducers: {
    updateUserLocation(state, action: PayloadAction<number[]>) {
      state.user_location = [...action.payload]
    },
    updateAccuracy(state, action: PayloadAction<number>) {
      state.accuracy = action.payload
    },
    updatePermissionStatus(state, action: PayloadAction<LocationPermissionStatus>) {
      state.permission_status = action.payload
    },
  },
})

export const { updateUserLocation, updateAccuracy, updatePermissionStatus } = gpsStateSlice.actions

export default gpsStateSlice.reducer
