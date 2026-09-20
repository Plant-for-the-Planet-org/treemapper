import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  GpsSliceInitialState,
  LocationAccuracyAuthorization,
  LocationPermissionStatus,
} from 'src/types/interface/slice.interface'

const initialState: GpsSliceInitialState = {
  user_location: [0, 0],
  accuracy: 0,
  permission_status: 'undetermined',
  accuracy_authorization: 'unknown',
  services_enabled: true,
  last_fix_at: null,
  gps_provider_available: true,
  network_provider_available: true,
  is_mocked: false,
}

export interface GpsFix {
  // GeoJSON order: [longitude, latitude].
  coords: number[]
  accuracy: number
  timestamp: number
  mocked: boolean
}

export interface GpsProviderStatus {
  gps: boolean
  network: boolean
}

const gpsStateSlice = createSlice({
  name: 'gpsSlice',
  initialState,
  reducers: {
    // Preferred writer: position, accuracy and the fix time move together, so
    // nothing can read a new coordinate against an old accuracy.
    updateUserFix(state, action: PayloadAction<GpsFix>) {
      state.user_location = [...action.payload.coords]
      state.accuracy = action.payload.accuracy
      state.last_fix_at = action.payload.timestamp
      state.is_mocked = action.payload.mocked
    },
    updateProviderStatus(state, action: PayloadAction<GpsProviderStatus>) {
      state.gps_provider_available = action.payload.gps
      state.network_provider_available = action.payload.network
    },
    updateUserLocation(state, action: PayloadAction<number[]>) {
      state.user_location = [...action.payload]
    },
    updateAccuracy(state, action: PayloadAction<number>) {
      state.accuracy = action.payload
    },
    updatePermissionStatus(state, action: PayloadAction<LocationPermissionStatus>) {
      state.permission_status = action.payload
    },
    updateAccuracyAuthorization(state, action: PayloadAction<LocationAccuracyAuthorization>) {
      state.accuracy_authorization = action.payload
    },
    updateServicesEnabled(state, action: PayloadAction<boolean>) {
      state.services_enabled = action.payload
    },
    clearUserFix(state) {
      state.user_location = [0, 0]
      state.accuracy = 0
      state.last_fix_at = null
      state.is_mocked = false
    },
  },
})

export const {
  updateUserFix,
  updateProviderStatus,
  updateUserLocation,
  updateAccuracy,
  updatePermissionStatus,
  updateAccuracyAuthorization,
  updateServicesEnabled,
  clearUserFix,
} = gpsStateSlice.actions

export default gpsStateSlice.reducer
