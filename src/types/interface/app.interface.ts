import { SIDE_DRAWER_ELEMENTS } from "../type/app.type"
import { RootStackParamList } from "../type/navigation.type"
import { FormElement } from "./form.interface"

export interface Coordinates {
  lat: number
  long: number
  id?: string
}

export interface SideDrawerItem {
  label: string
  screen: keyof RootStackParamList | any
  icon: React.ReactNode
  visible: boolean
  key:  SIDE_DRAWER_ELEMENTS
  disable?: boolean
}

export interface IScientificSpecies {
  guid: string
  scientific_name: string
  is_user_species: boolean
  is_uploaded?: boolean
  aliases: string
  image?: string
  description?: string
  is_updated?: boolean
}


export interface ProjectInterface{
  allowDonations: boolean,
  countPlanted:number,
  countTarget:number
  country:string
  currency: string
  id:string
  image:string
  name: string
  slug: string
  treeCost: number
  sites: any[],
  geometry: string
}

export interface CarouselInterventionData{
  image: string
  id: string
  // id: string
  // species_name: string
}

export interface DropdownData {
  label: string
  value: string
  index?: number
  extra?: any
}


export interface Metadata{
  id: string
  key: string
  value: string
  order: number
  accessType: 'public' | 'private',
}


export interface IAdditonalDetailsForm{
  form_id: string,
  order:  number,
  elements: FormElement[],
  title: string,
  description: string,
}
