import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { AnalyticsConsent, AppInitialState } from 'src/types/interface/slice.interface'

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
  imageSize: 0,
  refetchProject: '',
  userProjectSpecies: [],
  seenTours: {},
  analyticsConsent: 'unset',
  rating: {
    eventCount: 0,
    lastAskedAt: 0,
    hasRated: false,
    dontAskAgain: false,
  },
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
    updateUserPojectSpecies(state, action: PayloadAction<IScientificSpecies[]>) {
      console.log('Updating user project species in state with', action.payload, 'species')
      state.userProjectSpecies = action.payload
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
    updateRefetchProject(state) {
      state.refetchProject = String(new Date())
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
    // Tours are a device-level "has this hardware seen it" concept, not an
    // account one, so they survive logoutAppUser below like speciesSync does.
    markTourSeen(state, action: PayloadAction<string>) {
      state.seenTours[action.payload] = true
    },
    // Consent is a device-level choice made before sign-in, so like seenTours
    // it survives logoutAppUser. The sidebar lets anyone change it.
    setAnalyticsConsent(state, action: PayloadAction<AnalyticsConsent>) {
      state.analyticsConsent = action.payload
    },
    // Records a "happy moment" that makes the store-rating prompt a little more
    // likely. Never resets on its own -- the prompt logic reads the count.
    registerRatingEvent(state) {
      // Older installs rehydrate without `rating`; heal it in place.
      if (!state.rating) {
        state.rating = { eventCount: 0, lastAskedAt: 0, hasRated: false, dontAskAgain: false }
      }
      state.rating.eventCount += 1
    },
    // The pre-prompt was shown; stamp the time so we don't ask again too soon.
    markRatingAsked(state) {
      if (!state.rating) return
      state.rating.lastAskedAt = Date.now()
    },
    // The person was sent to the store. Never ask again.
    markRated(state) {
      if (!state.rating) return
      state.rating.hasRated = true
    },
    // The person opted out. The automatic prompt never appears again.
    setRatingDontAskAgain(state) {
      if (!state.rating) return
      state.rating.dontAskAgain = true
    },
    logoutAppUser(state) {
      return { ...initialState, speciesSync: true, speciesLocalURL: state.speciesLocalURL, lastServerInterventionpage: '', seenTours: state.seenTours, analyticsConsent: state.analyticsConsent, rating: state.rating }
    },
  },
})

export const { clearImageSize, updateImageSize, setUpdateAppCount, updateDataMigrated, updateSpeciesDownloaded, updateUserLogin, updateUserToken, updateSpeciesSyncStatus, updateServerIntervention, updateLastServerIntervention, logoutAppUser, updateUserSpeciesadded, updateNewIntervention, updateLastSyncData, updateRefetchProject, updateUserPojectSpecies, markTourSeen, setAnalyticsConsent, registerRatingEvent, markRatingAsked, markRated, setRatingDontAskAgain } = appStateSlice.actions

export default appStateSlice.reducer
