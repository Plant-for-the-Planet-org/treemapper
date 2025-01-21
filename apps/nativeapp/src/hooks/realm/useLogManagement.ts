import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { LogDetails } from 'src/types/interface/slice.interface'
import { v4 as uuid } from 'uuid';

const useLogManagement = () => {
  const realm = useRealm()

  const addNewLog = (
    logDetails: LogDetails
  ) => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.ActivityLogs,
          { ...logDetails, timestamp: new Date(), appVersion: "", id: uuid() },
          Realm.UpdateMode.All,
        )
      })
    } catch (error) {
      console.error('Error during write:', error)
    }
  }

  const deleteAllLogs = () => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.ActivityLogs);
        realm.delete(unSyncedObjects);
      });
    } catch (error) {
      console.error('Error during update:', error);
    }
  };

  return { addNewLog, deleteAllLogs }
}

export default useLogManagement
