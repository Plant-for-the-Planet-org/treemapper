import {useRealm, Realm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
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

  return {writeBulkSpecies}
}

export default useManageScientificSpecies
