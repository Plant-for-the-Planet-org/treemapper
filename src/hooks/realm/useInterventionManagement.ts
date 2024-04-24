import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
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
  const addSampleTrees = async (finalData: InterventionData): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, finalData.intervention_id);
        intervention.sample_trees = finalData.sample_trees
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateInterventionCoverImage = async (imageURL: string, intervnetionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.cover_image_url = imageURL
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const deleteSampleTreeIntervention = async (treeId: string, intervnetionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        const filterTress = intervention.sample_trees.filter(el => el.tree_id !== treeId)
        intervention.sample_trees = filterTress
        console.log('slkdcjhk', intervention.sample_trees )
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateSampleTreeImage = async (intervnetionID: string, treeId: string,imageUrl: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        const filterTress = intervention.sample_trees.filter(el => el.tree_id === treeId)
        filterTress[0].image_url = imageUrl
        intervention.sample_trees = filterTress
      });
      console.log("done writing")
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const saveIntervention = async (intervnetionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.is_complete = true
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const deleteIntervention = async (intervnetionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        realm.delete(intervention);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  return { addNewIntervention, addSampleTrees, updateInterventionCoverImage, deleteSampleTreeIntervention, saveIntervention, updateSampleTreeImage, deleteIntervention }
}

export default useInterventionManagement
