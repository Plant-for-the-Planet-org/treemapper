import {Coordinates} from './app.interface'

export interface AppInitialState {
  last_open: number
}

export interface GpsSliceInitalState {
  user_location: Coordinates
}

export interface TakePictureInitialState {
  url: string
  id: string
  width: number
  height: number
}
