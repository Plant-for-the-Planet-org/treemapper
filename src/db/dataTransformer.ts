import {SERVER_SCIENTIFIC_SPECIES} from 'src/types/interface/realm.interface'

export const transformScientificSpecies = (data: SERVER_SCIENTIFIC_SPECIES) => {
  return {
    guid: data.guid,
    scientificName: data.scientific_name,
    aliases: data.scientific_name,
  }
}
