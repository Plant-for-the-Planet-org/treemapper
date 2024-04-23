import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {GpsSliceInitalState} from 'src/types/interface/slice.interface'

const initialState: GpsSliceInitalState = {
  user_location: [],
  showBlockerModal: false
}

const gpsStateSlice = createSlice({
  name: 'gpsSlice',
  initialState,
  reducers: {
    updateUserLocation(state, action: PayloadAction<number[]>) {
      state.user_location =[...action.payload]
    },
    updaeBlockerModal(state, action: PayloadAction<boolean>) {
      state.showBlockerModal = action.payload
    },
  },
})

export const {updateUserLocation, updaeBlockerModal} = gpsStateSlice.actions

export default gpsStateSlice.reducer
