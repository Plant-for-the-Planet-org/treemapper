import {useRealm, Realm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import { InterventionData } from 'src/types/interface/slice.interface'

const useInterventionManagement = () => {
  const realm = useRealm()
  const addNewIntervention = async (
    interventoin: InterventionData,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
          realm.create(
            RealmSchema.Intervention,
            interventoin,
            Realm.UpdateMode.All,
          )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during bulk write:', error)
      return Promise.reject(false)
    }
  }

  return {addNewIntervention}
}

export default useInterventionManagement
