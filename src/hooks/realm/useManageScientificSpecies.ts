import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { SERVER_SCIENTIFIC_SPECIES } from 'src/types/interface/realm.interface'
import useLogManagement from './useLogManagement'

interface ServerSpeciesSync {
  "aliases": string
  "description": null | string
  "id": string
  "image": null | string
  "scientificName": string
  "scientificSpecies": string
}

const useManageScientificSpecies = () => {
  const { addNewLog } = useLogManagement()
  const realm = useRealm()
  const writeBulkSpecies = async (
    speciesData: SERVER_SCIENTIFIC_SPECIES[],
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        for (let i = 0; i < speciesData.length; i++) {
          realm.create(
            RealmSchema.ScientificSpecies,
            {
              guid: speciesData[i].guid,
              scientificName: speciesData[i].scientific_name
            },
            Realm.UpdateMode.All,
          )
        }
      })
      return Promise.resolve(true)
    } catch (error) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "DB error occured while syncing species data.",
        logLevel: 'error',
        statusCode: '000',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false)
    }
  }


  const addUndefinedSpecies = async (): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.ScientificSpecies,
          {
            guid: 'undefined',
            scientificName: 'undefined',
            isUserSpecies: true,
            aliases: 'Not Known'
          },
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "DB error occured while adding undefined species.",
        logLevel: 'error',
        statusCode: '000',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false)
    }
  }



  const updateUserFavSpecies = async (guid: string, isFavourite: boolean) => {
    try {
      realm.write(() => {
        const specieToUpdate = realm.objectForPrimaryKey<IScientificSpecies>(
          RealmSchema.ScientificSpecies,
          guid,
        )
        specieToUpdate.isUserSpecies = isFavourite
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


  const addUserSpecies = async (item: ServerSpeciesSync[]) => {
    try {
      realm.write(() => {
        item.forEach(specie => {
          const data = {
            guid: specie.scientificSpecies,
            scientificName: specie.scientificName || '',
            isUserSpecies: true,
            isUploaded: true,
            aliases: specie.aliases || '',
            image: specie.image || '',
            description: specie.description || '',
            isUpdated: true,
          }
          realm.create(
            RealmSchema.ScientificSpecies,
            data,
            Realm.UpdateMode.All,
          )
        })
      })
      return Promise.resolve(true)
    } catch (error) {
      addNewLog({
        logType: 'MANAGE_SPECIES',
        message: "Error occured while adding user species.",
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false)
    }
  }

  const deleteAllUserSpecies = async () => {
    try {
      const favoriteData = realm.objects<IScientificSpecies>(RealmSchema.ScientificSpecies).filtered('isUserSpecies == true');
      realm.write(() => {
        favoriteData.forEach(specie => {
          specie.isUserSpecies = false
        })
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during bulk write:', error)
      return Promise.reject(false)
    }
  }

  return { addUndefinedSpecies, writeBulkSpecies, updateUserFavSpecies, updateSpeciesDetails, addUserSpecies, deleteAllUserSpecies }
}

export default useManageScientificSpecies
