import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppInitialState } from 'src/types/interface/slice.interface'

const initialState: AppInitialState = {
  isLogedIn: false,
  accessToken: '',
  idToken: '',
  expiringAt: 0,
  speciesSync: false,
  serverInterventionAdded: false,
  lastServerInterventionpage: 'treemapper/plantLocations?limit=4&_scope=extended'
}

const appStateSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    updateUserLogin(state, action: PayloadAction<boolean>) {
      state.isLogedIn = action.payload
    },
    updateUserToken(
      state,
      action: PayloadAction<{
        idToken: string
        accessToken: string
        expiringAt: number
      }>,
    ) {
      state.accessToken = action.payload.accessToken
      state.expiringAt = action.payload.expiringAt
      state.idToken = action.payload.idToken
    },
    updateSpeciesSyncStatus(state, action: PayloadAction<boolean>) {
      state.speciesSync = action.payload
    },
    updateServerIntervetion(state, action: PayloadAction<boolean>) {
      state.serverInterventionAdded = action.payload
    },
    updateLastServerIntervetion(state, action: PayloadAction<string>) {
      state.lastServerInterventionpage = action.payload
    },
  },
})

export const { updateUserLogin, updateUserToken, updateSpeciesSyncStatus, updateServerIntervetion, updateLastServerIntervetion } = appStateSlice.actions

export default appStateSlice.reducer
