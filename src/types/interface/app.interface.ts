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
  screen: keyof RootStackParamList
  icon: React.ReactNode
  visible: boolean
  key:  SIDE_DRAWER_ELEMENTS
  disable?: boolean
}

export interface IScientificSpecies {
  guid: string
  scientificName: string
  isUserSpecies: boolean
  isUploaded?: boolean
  aliases: string
  image?: string
  description?: string
  isUpdated?: boolean
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
  geometry: string,
  purpose: string,
  intensity: number,
  frequency: string
}

export interface CarouselInterventionData{
  image: string
  id: string
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


export interface IAdditionalDetailsForm{
  form_id: string,
  order:  number,
  elements: FormElement[],
  title: string,
  description: string,
}
