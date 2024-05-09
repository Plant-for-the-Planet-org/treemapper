import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { LogDetails } from 'src/types/interface/slice.interface'
import { v4 as uuid } from 'uuid';

const useLogManagement = () => {
  const realm = useRealm()

  const addNewLog = async (
    logDetails: LogDetails
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.ActivityLogs,
          { ...logDetails, timestamp: Date.now(), appVersion: "", id: uuid() },
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }


  const deleteAllLogs = async (): Promise<boolean> => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.ActivityLogs);
        realm.delete(unSyncedObjects);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };



  return { addNewLog, deleteAllLogs }
}

export default useLogManagement
