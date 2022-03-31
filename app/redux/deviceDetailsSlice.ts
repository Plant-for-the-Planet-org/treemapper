import MapboxGL from '@react-native-mapbox-gl/maps';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeoPosition } from 'react-native-geolocation-service';

export interface DeviceDetailsState {
  position: GeoPosition | MapboxGL.Location | null;
  gpsAccuracy: number;
}

const initialState: DeviceDetailsState = {
  position: null,
  gpsAccuracy: 0,
};

export const deviceDetailsSlice = createSlice({
  name: 'deviceDetails',
  initialState,
  reducers: {
    setPosition: (state, action: PayloadAction<GeoPosition | MapboxGL.Location | null>) => {
      state.position = action.payload;
    },
    setGPSAccuracy: (state, action: PayloadAction<number>) => {
      state.gpsAccuracy = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setPosition, setGPSAccuracy } = deviceDetailsSlice.actions;

export default deviceDetailsSlice.reducer;
