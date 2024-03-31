import {useRealm, Realm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import {SERVER_SCIENTIFIC_SPECIES} from 'src/types/interface/realm.interface'

const useManageScientificSpecies = () => {
  const realm = useRealm()
  const writeBulkSpecies = async (
    speciesData: SERVER_SCIENTIFIC_SPECIES[],
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        for (const specie of speciesData) {
          realm.create(
            RealmSchema.ScientificSpecies,
            specie,
            Realm.UpdateMode.All,
          )
        }
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during bulk write:', error)
      return Promise.reject(false)
    }
  }

  const updateUserFavSpecies = async (guid: string, isFavourite: boolean) => {
    try {
      realm.write(() => {
        const specieToUpdate = realm.objectForPrimaryKey(
          RealmSchema.ScientificSpecies,
          guid,
        )
        specieToUpdate.is_user_species = isFavourite
      })
    } catch (error) {
      console.error('Error during species update:', error)
    }
  }


  const updateSpeciesDetails = async (item: IScientificSpecies) => {
    try {
      realm.write(() => {
        const specieToUpdate = realm.objectForPrimaryKey<IScientificSpecies>(
          RealmSchema.ScientificSpecies,
          item.guid,
        )
        specieToUpdate.description = item.description
        specieToUpdate.image = item.image
        specieToUpdate.aliases = item.aliases

      })
    } catch (error) {
      console.error('Error during species update:', error)
    }
  }

  return {writeBulkSpecies, updateUserFavSpecies, updateSpeciesDetails}
}

export default useManageScientificSpecies
