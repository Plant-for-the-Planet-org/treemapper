import {Coordinates, IScientificSpecies} from './app.interface'
import {MainForm} from './form.interface'

export interface AppInitialState {
  isLogedIn: boolean
  accessToken: string
  idToken: string
  expiringAt: number
}

export interface ProjectStateSlice {
  projectAdded: boolean
  errorOccured: boolean
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
  intervention_date: string
  skip_intervention_form: boolean
  project_id: string
  site_id: string
  entire_site_intervention: boolean
  location_type: 'Point' | 'Polygon'
  location_title: string
  coordinates: Coordinates[]
  preview_blank_polygon: boolean
  cover_image_required: boolean
  cover_image_url: string
  cover_image_id: string
  species_required: boolean
  is_multi_species: boolean
  species_count_required: boolean
  species_modal_message: string
  species_modal_unit: string
  species: string[]
  tree_details_required: boolean
  has_sample_trees: boolean
  tree_image_required: boolean
  tree_details: SampleTree[]
  form_details: MainForm[]
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

export interface SampleTreeSlice {
  form_id: string
  tree_details: SampleTree[]
  species: Array<{
    info: IScientificSpecies
    count: number
  }>
  sample_tree_count: number
  move_next_primary: string
  move_next_secondary: string
}

// export interface UserInterface {
//     address: {
//       address: null | string;
//       city: null | string;
//       country: string;
//       zipCode: null | string;
//     };
//     bio: null | string;
//     country: string;
//     created: string;
//     currency: null | string;
//     displayName: string;
//     email: string;
//     firstname: string;
//     getNews: boolean;
//     hasLogoLicense: boolean;
//     id: string;
//     image: null | string;
//     isPrivate: boolean;
//     lastname: string;
//     locale: null | string;
//     name: null | string;
//     planetCash: null | number;
//     score: {
//       personal: number;
//       received: number;
//       target: number;
//     };
//     slug: string;
//     supportPin: string;
//     supportedProfile: null | string;
//     tin: null | string;
//     type: string;
//     url: null | string;
//     urlText: null | string;
//   }

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
