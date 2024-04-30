import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'

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
      console.error('Error during write:', error)
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
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateSampleTreeImage = async (intervnetionID: string, treeId: string, imageUrl: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        const index = intervention.sample_trees.findIndex(el => el.tree_id === treeId)
        intervention.sample_trees[index].image_url = imageUrl
      });
      console.log("done writing")
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateSampleTreeDetails = async (details: SampleTree): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, details.intervention_id);
        const index = intervention.sample_trees.findIndex(el => el.tree_id === details.tree_id)
        intervention.sample_trees[index] = { ...details }
      });
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


  const updateSampleTreeSpecies = async (interventionID: string, treeId: string, speciesDetails: IScientificSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        const index = intervention.sample_trees.findIndex(el => el.tree_id === treeId)
        intervention.sample_trees[index] = {
          ...intervention.sample_trees[index],
          specie_name: speciesDetails.scientific_name,
          species_guid: speciesDetails.guid
        }
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };



  return { addNewIntervention, addSampleTrees, updateInterventionCoverImage, deleteSampleTreeIntervention, saveIntervention, updateSampleTreeImage, deleteIntervention, updateSampleTreeDetails, updateSampleTreeSpecies }
}

export default useInterventionManagement
