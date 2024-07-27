import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppInitialState } from 'src/types/interface/slice.interface'

const initialState: AppInitialState = {
  isLoggedIn: false,
  accessToken: '',
  idToken: '',
  refreshToken:'',
  expiringAt: 0,
  speciesSync: false,
  serverInterventionAdded: false,
  lastServerInterventionpage: '',
  intervention_updated: 0,
  userSpecies:false
}

const appStateSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    updateUserLogin(state, action: PayloadAction<boolean>) {
      state.isLoggedIn = action.payload
    },
    updateUserToken(
      state,
      action: PayloadAction<{
        idToken: string
        accessToken: string
        expiringAt: number
        refreshToken: string
      }>,
    ) {
      state.accessToken = action.payload.accessToken
      state.expiringAt = action.payload.expiringAt
      state.idToken = action.payload.idToken
      state.refreshToken = action.payload.refreshToken
    },
    updateSpeciesSyncStatus(state, action: PayloadAction<boolean>) {
      state.speciesSync = action.payload
    },
    updateServerIntervention(state, action: PayloadAction<boolean>) {
      state.serverInterventionAdded = action.payload
    },
    updateLastServerIntervention(state, action: PayloadAction<string>) {
      state.lastServerInterventionpage = action.payload
    },
    updateNewIntervention(state) {
      state.intervention_updated = Date.now()
    },
    updateUserSpeciesadded(state,action: PayloadAction<boolean>){
      state.userSpecies = action.payload
    },
    logoutAppUser() {
      return { ...initialState, speciesSync: true }
    },
  },
})

export const { updateUserLogin, updateUserToken, updateSpeciesSyncStatus, updateServerIntervention: updateServerIntervention, updateLastServerIntervention: updateLastServerIntervention, logoutAppUser, updateUserSpeciesadded,updateNewIntervention } = appStateSlice.actions

export default appStateSlice.reducer
