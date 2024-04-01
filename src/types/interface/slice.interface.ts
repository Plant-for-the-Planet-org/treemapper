import {Coordinates} from './app.interface'
import { MainForm } from './form.interface'

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

export interface RegisterFormSliceInitalState {
  form_id: string
  key: string
  title: string
  location_type: 'Point' | 'Polygon'
  location_title: string
  coordinates: Coordinates[]
  cover_image_required: boolean
  cover_image_url: string
  cover_image_id: string
  species_required: boolean
  species: FormSpecies[]
  form_details: MainForm[]
}


export interface FormSpecies {
  species_guid: string
  tree_id: string
}