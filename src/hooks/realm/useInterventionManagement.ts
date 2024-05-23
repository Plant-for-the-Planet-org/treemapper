import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { FormElement } from 'src/types/interface/form.interface'
import { InterventionData, PlantedSpecies, RegisterFormSliceInitalState, SampleTree } from 'src/types/interface/slice.interface'
import { createNewInterventionFolder } from 'src/utils/helpers/fileManagementHelper'

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
  const addSampleTrees = async (id: string, treeDetails: SampleTree): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, id);
        const updatedTreeDetails = intervention.sample_trees.filter(el => el.tree_id !== treeDetails.tree_id);
        intervention.sample_trees = [...updatedTreeDetails, treeDetails]
        intervention.lastScreen = 'treeDetails'
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
        if (intervention) {
          realm.delete(intervention);
        }
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


  const deleteAllSyncedIntervention = async (): Promise<boolean> => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.Intervention).filtered('status == "SYNCED"');
        realm.delete(unSyncedObjects);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const initializeIntervention = async (
    interventoin: RegisterFormSliceInitalState,
  ): Promise<boolean> => {
    await createNewInterventionFolder(interventoin.form_id)
    const data: InterventionData = {
      intervention_id: interventoin.form_id,
      intervention_key: interventoin.key,
      intervention_title: interventoin.title,
      intervention_date: interventoin.intervention_date,
      project_id: interventoin.project_id,
      project_name: interventoin.site_name,
      site_name: interventoin.site_name,
      location_type: interventoin.location_type,
      location: {
        'type': `${interventoin.location_type}`,
        coordinates: ''
      },
      cover_image_url: '',
      has_species: interventoin.species_required,
      species: [],
      has_sample_trees: interventoin.has_sample_trees,
      sample_trees: [],
      is_complete: false,
      site_id: '',
      intervention_type: interventoin.key,
      form_data: [],
      additional_data: [],
      meta_data: '{}',
      status: 'NOT_SYNCED',
      hid: '',
      coords: {
        type: 'Point',
        coordinates: []
      },
      entire_site: interventoin.entire_site_selected,
      lastScreen: 'form',
      planted_species: []
    }
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.Intervention,
          data,
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const updateInterventionLocation = async (intervnetionID: string, location: { type: 'Point' | 'Polygon', coordinates: string }, isEntireSite: boolean): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.location = location
        intervention.entire_site = isEntireSite
        intervention.lastScreen = 'location'
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateInterventionPlantedSpecies = async (intervnetionID: string, species: PlantedSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        const filteredSpecies = intervention.planted_species.filter(el => el.guid !== species.guid)
        intervention.planted_species = [...JSON.parse(JSON.stringify(filteredSpecies)), species]
        intervention.lastScreen = 'species'
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateLocalFormDetailsIntervention = async (intervnetionID: string, addData: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.form_data = addData
        intervention.lastScreen = 'localForm'
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };



  const updateDynamicFormDetails = async (intervnetionID: string, addData: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.additional_data = addData
        intervention.lastScreen = 'dynamicForm'
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateInterventionLastScreen = async (intervnetionID: string, screenName: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.lastScreen = screenName
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };

  const updateInterventionMetaData = async (intervnetionID: string, metaData: any,): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.meta_data = metaData
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };


  return { addNewIntervention, updateInterventionMetaData, updateInterventionLastScreen, updateDynamicFormDetails, updateLocalFormDetailsIntervention, initializeIntervention, addSampleTrees, updateInterventionCoverImage, deleteSampleTreeIntervention, saveIntervention, updateSampleTreeImage, deleteIntervention, updateSampleTreeDetails, updateSampleTreeSpecies, deleteAllSyncedIntervention, updateInterventionLocation, updateInterventionPlantedSpecies }
}

export default useInterventionManagement



