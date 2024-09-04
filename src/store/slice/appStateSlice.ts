import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppInitialState } from 'src/types/interface/slice.interface'

const initialState: AppInitialState = {
  isLoggedIn: false,
  accessToken: '',
  idToken: '',
  refreshToken: '',
  expiringAt: 0,
  speciesSync: false,
  speciesLocalURL: '',
  serverInterventionAdded: false,
  lastServerInterventionpage: '',
  intervention_updated: 0,
  userSpecies: false,
  lastSyncDate: 0,
  dataMigrated: false,
  updateAppCount: 10,
  imageSize: 0
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
    updateUserSpeciesadded(state, action: PayloadAction<boolean>) {
      state.userSpecies = action.payload
    },
    updateLastSyncData(state, action: PayloadAction<number>) {
      state.lastSyncDate = action.payload
    },
    updateSpeciesDownloaded(state, action: PayloadAction<string>) {
      state.speciesLocalURL = action.payload
    },
    updateDataMigrated(state, action: PayloadAction<boolean>) {
      state.dataMigrated = action.payload
    },
    setUpdateAppCount(state) {
      if (state.updateAppCount > 0) {
        state.updateAppCount -= 1
      } else {
        state.updateAppCount = 10
      }
    },
    updateImageSize(state, action: PayloadAction<number>) {
      state.imageSize = state.imageSize + action.payload
    },
    clearImageSize(state) {
      state.imageSize = 0
    },
    logoutAppUser(state) {
      return { ...initialState, speciesSync: true, speciesLocalURL: state.speciesLocalURL }
    },
  },
})

export const { clearImageSize, updateImageSize, setUpdateAppCount, updateDataMigrated, updateSpeciesDownloaded, updateUserLogin, updateUserToken, updateSpeciesSyncStatus, updateServerIntervention, updateLastServerIntervention, logoutAppUser, updateUserSpeciesadded, updateNewIntervention, updateLastSyncData } = appStateSlice.actions

export default appStateSlice.reducer
