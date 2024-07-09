import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DisplayMapSlice, InterventionData } from 'src/types/interface/slice.interface'
import { INTERVENTION_FILTER, INTERVENTION_TYPE, MAP_VIEW } from 'src/types/type/app.type'
import { AllIntervenionType } from 'src/utils/constants/knownIntervention'

const initialState: DisplayMapSlice = {
  selectedIntervention: '',
  showCarousel: false,
  activeIndex: 0,
  adjacentIntervention: [],
  showOverlay: false,
  activeInterventionIndex: 0,
  interventionFilter: 'always',
  selectedFilters: [...AllIntervenionType],
  mainMapView: 'VECTOR',
  showPlots: true,
  onlyRemeasurement: false
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
    updateInterventionFilter(state, action: PayloadAction<INTERVENTION_FILTER>) {
      state.interventionFilter = action.payload
    },
    updateSelectedFilters(state, action: PayloadAction<INTERVENTION_TYPE[]>) {
      state.selectedFilters = action.payload
    },
    updateMainMapView(state, action: PayloadAction<MAP_VIEW>) {
      state.mainMapView = action.payload
    },
    updateShowlots(state, action: PayloadAction<boolean>) {
      state.showPlots = action.payload
    },
    updateRemeasurementFilter(state, action: PayloadAction<boolean>) {
      state.onlyRemeasurement = action.payload
    },
  },
})

export const { updateRemeasurementFilter, updateShowlots, updateMainMapView, updateSelectedIntervention, updateInterventionFilter, clearCarouselData, updateActiveInterventionIndex, updateActiveIndex, updateAdjacentIntervention, updateShowOverlay, updateSelectedFilters } = displayMapSlice.actions

export default displayMapSlice.reducer
