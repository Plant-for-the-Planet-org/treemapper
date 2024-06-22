import { INTERVENTION_FILTER, INTERVENTION_STATUS, INTERVENTION_TYPE, LOG_LEVELS, LOG_TYPES, MAP_BOUNDS, OBSERVATION_TYPE, PLOT_COMPLEXITY, PLOT_PLANT, PLOT_PLANT_STATUS, PLOT_SHAPE, PLOT_TYPE } from '../type/app.type'
import { FormElement, MainForm } from './form.interface'

export interface AppInitialState {
  isLogedIn: boolean
  accessToken: string
  idToken: string
  expiringAt: number
  speciesSync: boolean
  serverInterventionAdded: boolean,
  lastServerInterventionpage: string
  intervention_updated: number
  userSpecies: boolean,
  refreshToken: string,
}

export interface MonitoringPlotSlice {
  lastUpdateAt: number
  updateScreen: string
}




export interface MapBoundSlice {
  bounds: number[]
  key: MAP_BOUNDS
}

export interface DisplayMapSlice {
  selectedIntervention: string
  showCarousel: boolean
  activeIndex: number
  adjacentIntervention: InterventionData[],
  showOverlay: boolean
  activeInterventionIndex: number
  interventionFilter: INTERVENTION_FILTER
  selectedFilters: INTERVENTION_TYPE[]
}

export interface ProjectStateSlice {
  projectAdded: boolean
  errorOccured: boolean
  currentProject: {
    projectName: string
    projectId: string
  }
  projectSite: {
    siteName: string
    siteId: string
  }
}

export interface GpsSliceInitalState {
  user_location: number[],
  showBlockerModal: boolean,
  accuracy: number
}

export interface TakePictureInitialState {
  url: string
  id: string
  width: number
  height: number
}

export interface FormValues {
  key: string
  value: string
  display: boolean
  unit: string
  priority: 'low' | 'medium' | 'high'
}

export interface RegisterFormSliceInitalState {
  form_id: string
  key: INTERVENTION_TYPE
  title: string
  intervention_date: number
  skip_intervention_form: boolean
  user_type: string
  project_id: string
  project_name: string
  site_id: string
  site_name: string
  can_be_entire_site: boolean
  entire_site_selected: boolean
  should_register_location: boolean
  location_type: 'Point' | 'Polygon'
  location_title: string
  coordinates: Array<number[]>
  preview_blank_polygon: boolean
  cover_image_url: string
  species_required: boolean
  is_multi_species: boolean
  species_count_required: boolean
  species_modal_message: string
  species_modal_unit: string
  species: string[]
  has_sample_trees: boolean
  tree_details_required: boolean
  tree_details: SampleTree[]
  form_details: MainForm[]
  meta_data: string
  additional_data: FormElement[]
  form_data: FormElement[]
  plantedSpecies: PlantedSpecies[]
  optionalLocation?: boolean
}

export interface SampleTree {
  tree_id: string
  species_guid: string
  intervention_id: string
  count: number
  latitude: number
  longitude: number
  device_latitude: number
  device_longitude: number
  location_accuracy: string
  image_url: string
  cdn_image_url: string
  specie_name: string
  local_name: string
  specie_diameter: number
  specie_height: number
  tag_id: string
  plantation_date: number
  status_complete: boolean
  location_id: string
  tree_type: 'sample' | 'single'
  additional_details: string
  app_meta_data: string
  hid: string
}

export interface PlantedSpecies {
  id?: string,
  guid: string,
  scientific_name: string,
  aliases: string,
  count: number,
  image: string
}

export interface AdditionalDetail {
  key: string
  value: string
  access_type: string
}

export interface SampleTreeSlice {
  form_id: string
  sample_tree_count: number
  move_next_primary: string
  move_next_secondary: string
  boundry: Array<number[]>
  coordinates: Array<number[]>
  image_url: string
  current_species: PlantedSpecies
}



export interface UserInterface {
  country: string
  created: string
  displayName: string
  email: string
  firstname: string
  id: string
  image: null | string
  isPrivate: boolean
  lastname: string
  locale: null | string
  name: null | string
  slug: string
  type: string
}

export interface InterventionLocation {
  type: string
  coordinates: string
}

export interface InterventionData {
  intervention_id: string
  intervention_key: INTERVENTION_TYPE
  intervention_title: string
  intervention_date: number
  project_id: string
  project_name: string
  site_name: string
  location_type: string
  location: InterventionLocation
  cover_image_url: string
  has_species: boolean
  species: string[]
  has_sample_trees: boolean
  sample_trees: SampleTree[]
  is_complete: boolean
  site_id: string
  intervention_type: INTERVENTION_TYPE
  form_data: FormElement[]
  additional_data: FormElement[]
  meta_data: string
  last_updated_at?: number
  status: INTERVENTION_STATUS,
  hid: string,
  coords: {
    type: 'Point',
    coordinates: number[]
  },
  entire_site: boolean
  active?: boolean
  lastScreen: string,
  planted_species: PlantedSpecies[]
}

export interface LogDetails {
  logType: LOG_TYPES,
  message: string,
  referenceId?: string,
  logLevel: LOG_LEVELS,
  statusCode: string,
  logStack?: string
  timestamp?: number
  id?: string
}


export interface PlantTimeLine {
  status: PLOT_PLANT_STATUS
  length: number
  width: number
  date: number
  length_unit: string
  width_unit: string
  image: string
  timeline_id: string
}


export interface PlotGroups {
  name: string,
  group_id: string,
  date_created: number
  details_updated_at: number
  plots: MonitoringPlot[]
}

export interface MonitoringPlot {
  plot_id: string
  complexity: PLOT_COMPLEXITY
  shape: PLOT_SHAPE
  type: PLOT_TYPE
  radius: number
  length: number
  width: number
  name: string
  location: InterventionLocation
  coords: {
    type: 'Point',
    coordinates: number[]
  },
  is_complete: boolean
  additional_data: string
  meta_data: string
  status: 'NOT_SYNCED' | "SYNCED"
  hid: string
  lastScreen: string
  plot_plants: PlantedPlotSpecies[]
  plot_created_at: number,
  plot_updated_at: number,
  local_image: string,
  cdn_image: string,
  plot_group?: any,
  observations: PlotObservation[]
}


export interface PlantedPlotSpecies {
  plot_plant_id: string
  tag: string
  guid: string
  scientific_name: string
  aliases: string
  count: number
  image: string
  timeline: PlantTimeLine[]
  planting_date: number
  is_alive: boolean
  type: PLOT_PLANT
  details_updated_at: number
  latitude: number
  longitude: number
}




export interface PlotObservation {
  obs_id: string
  type: OBSERVATION_TYPE
  obs_date: number
  value: number
  unit: string
}