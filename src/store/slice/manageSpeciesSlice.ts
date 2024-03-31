import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { Coordinates } from 'src/types/interface/app.interface'
import {GpsSliceInitalState} from 'src/types/interface/slice.interface'

const initialState: GpsSliceInitalState = {
  user_location: {
    lat: 0,
    long: 0,
  },
}

const gpsStateSlice = createSlice({
  name: 'gpsSlice',
  initialState,
  reducers: {
    updateUserLocation(state, action: PayloadAction<Coordinates>) {
      state.user_location ={...action.payload}
    },
  },
})

export const {updateUserLocation} = gpsStateSlice.actions

export default gpsStateSlice.reducer
