export interface Coordinates {
  lat: number
  long: number
  id?: string
}

export interface SideDrawerItem {
  label: string
  screen: 'ManageSpecies'
  icon: React.ReactNode
}

export interface IScientificSpecies {
  guid: string
  scientific_name: string
  is_user_species: boolean
  is_uploaded?: boolean
  species_id?: string
  aliases: string
  image?: string
  description?: string
  is_updated?: boolean
}


