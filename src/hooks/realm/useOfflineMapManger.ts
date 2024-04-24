import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'


const useOfflineMapManager = () => {
    const realm = useRealm()
    const createNewOfflineMap = async (
        data
    ): Promise<boolean> => {
        try {
            realm.write(() => {
                realm.create(
                    RealmSchema.OfflineMap,
                    {
                        name: data.name,
                        size: data.size,
                        areaName: data.areaName
                    },
                    Realm.UpdateMode.All,
                )
            })
            return Promise.resolve(true)
        } catch (error) {
            console.error('Error during bulk write:', error)
            return Promise.reject(false)
        }
    }

    const deleteOfflineMap = async (item: any): Promise<boolean> => {
        try {
            realm.write(() => {
                realm.delete(item);
            });
            return Promise.resolve(true)
        } catch (error) {
            console.error('Error during bulk write:', error)
            return Promise.reject(false)
        }

    }

    return { createNewOfflineMap, deleteOfflineMap}
}

export default useOfflineMapManager
