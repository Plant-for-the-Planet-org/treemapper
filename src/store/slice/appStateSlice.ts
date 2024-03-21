import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {AppInitialState} from 'src/types/interface/slice.interface'

const initialState: AppInitialState = {
  last_open: 0,
}

const appStateSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    updateLastOpen(state, action: PayloadAction<number>) {
      state.last_open = action.payload
    },
  },
})

export const {updateLastOpen} = appStateSlice.actions

export default appStateSlice.reducer
