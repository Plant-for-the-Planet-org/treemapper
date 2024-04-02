import {Coordinates} from './app.interface'
import {MainForm} from './form.interface'

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
  tree_details: SampleTree[]
  form_details: MainForm[]
  has_sample_trees: boolean
}

export interface SampleTree {
  species_guid: string
  tree_id: string
  count: number
  latitude: string
  longitude: string
  device_latitude: string
  device_logitude: string
  loocation_accuracy: string
  image_url: string
  cdn_image_url: string
  specie_id: string
  specie_name: string
  specie_diameter: string
  specie_height: number
  tag_id: string
  plantation_date: string
  status: boolean
  location_id: string
  tree_type: string
  additional_details: AdditionalDetail
  app_meta_data: string
  hid: string
}

export interface AdditionalDetail {
  key: string
  value: string
  access_type: string
}

