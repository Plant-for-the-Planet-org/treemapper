import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DisplayMapSlice, InterventionData } from 'src/types/interface/slice.interface'

const initialState: DisplayMapSlice = {
  selectedIntervention: '',
  showCarousel: false,
  activeIndex: 0,
  adjacentIntervention: [],
  showOverlay: false,
  activeInterventionIndex: 0
  
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
      state.showOverlay = false
      state.adjacentIntervention = []
      state.activeInterventionIndex = 0
    },
    updateActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload
    },
    updateAdjacentIntervention(state, action: PayloadAction<InterventionData[]>) {
      state.showOverlay = true
      state.adjacentIntervention = action.payload
    },
    updateActiveInterventionIndex(state, action: PayloadAction<number>) {
      state.activeInterventionIndex = action.payload
    },
    updateShowOverlay(state, action: PayloadAction<boolean>) {
      state.showOverlay = action.payload
    },
  },
})

export const { updateSelectedIntervention, clearCarouselData, updateActiveInterventionIndex, updateActiveIndex, updateAdjacentIntervention, updateShowOverlay } = displayMapSlice.actions

export default displayMapSlice.reducer
