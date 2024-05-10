import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { Metadata } from 'src/types/interface/app.interface'

const useMetaData = () => {
  const realm = useRealm()

  const addNewMetadata = async (
    metaData: Metadata,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.Metadata,
          metaData,
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }
  const updateMetaData = async ( data: Metadata): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<Metadata>(RealmSchema.Metadata, data.id);
        intervention.key =data.key
        intervention.value =data.value
        intervention.accessType =data.accessType
        intervention.order =data.order

      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };
  const deleteMetaData = async (id: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<Metadata>(RealmSchema.Metadata, id);
        realm.delete(intervention);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };



  return { addNewMetadata, updateMetaData, deleteMetaData}
}

export default useMetaData;
