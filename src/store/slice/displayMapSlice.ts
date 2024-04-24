import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {DisplayMapSlice} from 'src/types/interface/slice.interface'

const initialState: DisplayMapSlice = {
  selectedIntervention: '',
  showCarousel: false,
  activeIndex: 0
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
      state.activeIndex = 0
    },
    updateActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload
    },
  },
})

export const {updateSelectedIntervention, clearCarouselData, updateActiveIndex} = displayMapSlice.actions

export default displayMapSlice.reducer
