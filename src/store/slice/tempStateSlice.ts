import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TempStateSlice } from 'src/types/interface/slice.interface'

const initialState: TempStateSlice = {
  webAuthLoading: false,
}

const tempStateSlice = createSlice({
  name: 'tempStateSlice',
  initialState,
  reducers: {
    updateWebAuthLoading(state, action: PayloadAction<boolean>) {
      state.webAuthLoading = action.payload
    },
  },
})

export const { updateWebAuthLoading } = tempStateSlice.actions

export default tempStateSlice.reducer
