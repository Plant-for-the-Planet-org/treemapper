import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { History, InterventionData, PlantedSpecies, RegisterFormSliceInitialState, SampleTree } from 'src/types/interface/slice.interface'
import { createNewInterventionFolder } from 'src/utils/helpers/fileManagementHelper'
import useLogManagement from './useLogManagement'
import { FormElement } from 'src/types/interface/form.interface'
import { INTERVENTION_STATUS, LAST_SCREEN } from 'src/types/type/app.type'
import { isAllRemeasurementDone } from 'src/utils/helpers/remeasurementHelper'

const useInterventionManagement = () => {
  const realm = useRealm()
  const { addNewLog } = useLogManagement()


  const initializeIntervention = async (
    intervention: RegisterFormSliceInitialState,
  ): Promise<boolean> => {
    const result = await createNewInterventionFolder(intervention.form_id)
    if (result.hasError) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while creating Intervention folder ' + intervention.form_id,
        logLevel: 'error',
        statusCode: '',
        logStack: result.msg
      })
      return false
    }
    const data: InterventionData = {
      form_id: intervention.form_id,
      intervention_id: intervention.form_id,
      location_id: '',
      intervention_key: intervention.key,
      intervention_title: intervention.title,
      intervention_date: intervention.intervention_date,
      project_id: intervention.project_id,
      project_name: intervention.project_name,
      site_id: intervention.site_id,
      site_name: intervention.site_name,
      location_type: intervention.location_type,
      location: {
        'type': `${intervention.location_type}`,
        coordinates: ''
      },
      image: '',
      image_data: [],
      has_species: intervention.species_required,
      has_sample_trees: intervention.has_sample_trees,
      sample_trees: [],
      is_complete: false,
      intervention_type: intervention.key,
      form_data: [],
      additional_data: [],
      meta_data: '{}',
      status: 'INITIALIZED',
      hid: '',
      coords: {
        type: 'Point',
        coordinates: []
      },
      entire_site: intervention.entire_site_selected,
      last_screen: 'FORM',
      planted_species: [],
      locate_tree: '',
      remeasurement_required: false,
      next_measurement_date: 0
    }
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.Intervention,
          data,
          Realm.UpdateMode.All,
        )
      })
      addNewLog({
        logType: 'INTERVENTION',
        message: 'New intervention added to db' + `(${intervention.title}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return Promise.resolve(true)
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while creating intervention' + `(${intervention.title}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false
    }
  }

  const addNewIntervention = async (
    intervention: InterventionData,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.Intervention,
          intervention,
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while adding server intervention ' + intervention.intervention_id,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false
    }
  }

  const addSampleTrees = async (id: string, treeDetails: SampleTree): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, id);
        const updatedTreeDetails = intervention.sample_trees.filter(el => el.tree_id !== treeDetails.tree_id);
        intervention.sample_trees = [...updatedTreeDetails, treeDetails]
        intervention.last_screen = "TREE_DETAILS"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Sample Tree added to intervention' + `(${treeDetails.intervention_id}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while adding sample tree' + `(${treeDetails.intervention_id}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false
    }
  };



  const deleteSampleTreeIntervention = async (treeId: string, interventionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        const sampleTree = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, treeId);
        const filterTress = intervention.sample_trees.filter(el => el.tree_id !== treeId)
        intervention.sample_trees = filterTress
        realm.delete(sampleTree)
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const updateSampleTreeImage = async (interventionID: string, treeId: string, imageUrl: string): Promise<boolean> => {
    try {
      realm.write(() => {
        console.log("interventionID", interventionID)
        const intervention = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, treeId);
        intervention.image_url = imageUrl
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const updateSampleTreeDetails = async (details: SampleTree): Promise<boolean> => {
    try {
      realm.write(() => {
        const treeDetails = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, details.tree_id);
        treeDetails.specie_height = details.specie_height
        treeDetails.specie_diameter = details.specie_diameter
        treeDetails.tag_id = details.tag_id
        treeDetails.plantation_date = details.plantation_date
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, details.intervention_id);
        intervention.last_updated_at = Date.now()
      });

      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const saveIntervention = async (interventionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.is_complete = true
        intervention.status = 'PENDING_DATA_UPLOAD'
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: `Intervention(${interventionID}) marked complete.`,
        logLevel: 'info',
        statusCode: ''
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: `Error occurred while marking Intervention(${interventionID}) complete.`,
        logLevel: 'info',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const deleteIntervention = async (interventionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        if (intervention) {
          realm.delete(intervention);
        }
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const updateSampleTreeSpecies = async (interventionID: string, treeId: string, speciesDetails: IScientificSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        console.log("intervention", interventionID)
        const treeDetails = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, treeId);
        treeDetails.specie_name = speciesDetails.scientificName
        treeDetails.species_guid = speciesDetails.guid
        treeDetails.local_name = speciesDetails.aliases
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        if (!!intervention && !intervention.has_sample_trees) {
          intervention.planted_species = [{
            guid: speciesDetails.guid,
            scientificName: speciesDetails.scientificName,
            aliases: speciesDetails.aliases,
            count: 1,
            image: speciesDetails.image
          }]
        }
        intervention.last_updated_at = Date.now()
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const deleteAllSyncedIntervention = async (): Promise<boolean> => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.Intervention).filtered('status == "SYNCED"');
        realm.delete(unSyncedObjects);
      });
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while clearing synced interventions for logout action.',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateInterventionLocation = async (interventionID: string, location: { type: string, coordinates: string }, isEntireSite: boolean, onlyUpdateLocation?: boolean): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.location = location
        intervention.entire_site = isEntireSite
        if (!onlyUpdateLocation) {
          intervention.last_screen = "LOCATION"
        }
        intervention.last_updated_at = Date.now()
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: `Location updated for Intervention-${interventionID}(${isEntireSite ? 'Entire Site' : location.type})`,
        logLevel: 'info',
        statusCode: ''
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while updating intervention location',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateInterventionPlantedSpecies = async (interventionID: string, species: PlantedSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        const filteredSpecies = intervention.planted_species.filter(el => el.guid !== species.guid)
        intervention.planted_species = [...JSON.parse(JSON.stringify(filteredSpecies)), species]
        intervention.last_screen = "SPECIES"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Species added to intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while adding intervention',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const removeInterventionPlantedSpecies = async (interventionID: string, species: PlantedSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        const filteredSpecies = intervention.planted_species.filter(el => el.guid !== species.guid)
        intervention.planted_species = [...JSON.parse(JSON.stringify(filteredSpecies))]
        intervention.last_screen = "SPECIES"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Species removed from intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while removing intervention',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateLocalFormDetailsIntervention = async (interventionID: string, addData: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.form_data = addData
        intervention.last_screen = "LOCAL_FORM"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Additional form data added to intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occurred while adding additional data',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateDynamicFormDetails = async (interventionID: string, addData: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.additional_data = addData
        intervention.last_screen = "DYNAMIC_FORM"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Form data added to intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error while adding form data',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateInterventionLastScreen = async (interventionID: string, screenName: LAST_SCREEN): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.last_screen = screenName
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Updated last screen for intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error while updating last screen for intervention' + `(${interventionID}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateInterventionMetaData = async (interventionID: string, metaData: any,): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.meta_data = metaData
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Updated metadata for intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return true
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error while updating metadata for intervention' + `(${interventionID}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateEditAdditionalData = async (interventionID: string, form_data: FormElement[], additional_data: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.form_data = form_data
        intervention.additional_data = additional_data
        intervention.last_updated_at = Date.now()
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Updated additional data for intervention' + `(${interventionID}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return true
    } catch (error) {
      console.log("Error", error)
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error while updating additional for intervention' + `(${interventionID}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return false;
    }
  };

  const updateInterventionStatus = async (interventionID: string, hid: string, location_id: string, status: INTERVENTION_STATUS): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        intervention.status = status
        intervention.hid = hid
        intervention.location_id = location_id
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const updateTreeStatus = async (tree_id: string, hid: string, sloc_id: string, status: INTERVENTION_STATUS, parent_id: string, coordinates: any): Promise<boolean> => {
    try {
      realm.write(() => {
        const treeDetails = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, tree_id);
        treeDetails.parent_id = parent_id
        treeDetails.hid = hid
        treeDetails.sloc_id = sloc_id
        treeDetails.status = status
        treeDetails.image_data = {
          ...treeDetails.image_data,
          coordinateID: coordinates[0].id,
          isImageUploaded: false,
        }
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const updateTreeImageStatus = async (tree_id: string, interventionId: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionId);
        intervention.status = 'SYNCED'
        const treeDetails = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, tree_id);
        treeDetails.status = 'SYNCED'
        treeDetails.image_data = {
          ...treeDetails.image_data,
          isImageUploaded: true,
        }
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  const addPlantHistory = async (treeId: string, e: History): Promise<boolean> => {
    try {
      realm.write(() => {
        const treeDetails = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, treeId);
        const now = new Date();
        treeDetails.remeasurement_dates = {
          ...treeDetails.remeasurement_dates,
          lastMeasurement: Date.now(),
          nextMeasurement: new Date(now.setFullYear(now.getFullYear() + 1)).getTime()// check when do i need to set this
        }
        if (e.imageUrl && !e.status) {
          treeDetails.image_url = e.imageUrl
          treeDetails.cdn_image_url = ''
        }
        if (e.status) {
          treeDetails.is_alive = false
        }
        treeDetails.remeasurement_requires = false
        treeDetails.history = [...treeDetails.history, e]
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };


  const checkAndUpdatePlantHistory = async (interventionID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const interventionData = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
        const newStatus = isAllRemeasurementDone(interventionData.sample_trees);
        interventionData.remeasurement_required = newStatus
        if (!newStatus) {
          const now = new Date();
          interventionData.next_measurement_date = new Date(now.setFullYear(now.getFullYear() + 1)).getTime()// check when do i need to set this
        }
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };


  return { initializeIntervention, updateInterventionLocation, updateInterventionPlantedSpecies, updateSampleTreeSpecies, updateInterventionLastScreen, updateSampleTreeDetails, addSampleTrees, updateLocalFormDetailsIntervention, updateDynamicFormDetails, updateInterventionMetaData, saveIntervention, addNewIntervention, removeInterventionPlantedSpecies, addPlantHistory, deleteAllSyncedIntervention, deleteSampleTreeIntervention, updateEditAdditionalData, updateSampleTreeImage, deleteIntervention, updateInterventionStatus, updateTreeStatus, updateTreeImageStatus, checkAndUpdatePlantHistory }
}

export default useInterventionManagement
