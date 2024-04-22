import { SIDE_DRAWER_ELEMENTS } from "../type/app.type"
import { RootStackParamList } from "../type/navigation.type"

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