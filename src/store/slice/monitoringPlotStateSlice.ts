import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MonitoringPlotSlice } from 'src/types/interface/slice.interface'

const initialState: MonitoringPlotSlice = {
  updateScreen: '',
  lastUpdateAt: Date.now(),
}

const monitoringPlotSlice = createSlice({
  name: 'monitoringPlotSlice',
  initialState,
  reducers: {
    updateMonitoringPlotData(state, action: PayloadAction<string>) {
      state.lastUpdateAt = Date.now()
      state.updateScreen = action.payload
    },
  },
})

export const { updateMonitoringPlotData } = monitoringPlotSlice.actions

export default monitoringPlotSlice.reducer
