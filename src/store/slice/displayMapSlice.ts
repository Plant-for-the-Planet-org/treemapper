import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {DisplayMapSlice} from 'src/types/interface/slice.interface'

const initialState: DisplayMapSlice = {
  selectedIntervention: '',
  showCarousel: false,
}

const displayMapSlice = createSlice({
  name: 'displayMapSlice',
  initialState,
  reducers: {
    updateSelectedIntervention(state, action: PayloadAction<string>) {
      state.selectedIntervention = action.payload
      state.showCarousel = true
    },
    clearCarouselData(state) {
      state.selectedIntervention = ''
      state.showCarousel = false
    },
  },
})

export const {updateSelectedIntervention, clearCarouselData} = displayMapSlice.actions

export default displayMapSlice.reducer
