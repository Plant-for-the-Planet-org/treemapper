import { useCallback } from 'react'
import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { LogDetails } from 'src/types/interface/slice.interface'
import { v4 as uuid } from 'uuid';

const useLogManagement = () => {
  const realm = useRealm()

  const addNewLog = useCallback((
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
  }, [realm])

  const deleteAllLogs = useCallback(() => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.ActivityLogs);
        realm.delete(unSyncedObjects);
      });
    } catch (error) {
      console.error('Error during update:', error);
    }
  }, [realm]);

  return { addNewLog, deleteAllLogs }
}

export default useLogManagement
