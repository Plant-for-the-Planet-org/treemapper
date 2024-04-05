import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {AppInitialState} from 'src/types/interface/slice.interface'

const initialState: AppInitialState = {
  isLogedIn: false,
}

const appStateSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    updateUserLogin(state, action: PayloadAction<boolean>) {
      state.isLogedIn = action.payload
    },
  },
})

export const {updateUserLogin} = appStateSlice.actions

export default appStateSlice.reducer
