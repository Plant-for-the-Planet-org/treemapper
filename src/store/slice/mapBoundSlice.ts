import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {MapBoundSlice} from 'src/types/interface/slice.interface'
import { MAP_BOUNDS } from 'src/types/type/app.type';

const initialState: MapBoundSlice = {
  bounds: [],
  key: 'UNKNOWN',
}

const mapBoundSlice = createSlice({
  name: 'mapBoundSlice',
  initialState,
  reducers: {
    updateMapBounds(
      state,
      action: PayloadAction<{bounds: number[]; key: MAP_BOUNDS}>,
    ) {
      state.bounds = action.payload.bounds
      state.key = action.payload.key
    },
  },
})

export const {updateMapBounds} = mapBoundSlice.actions

export default mapBoundSlice.reducer
