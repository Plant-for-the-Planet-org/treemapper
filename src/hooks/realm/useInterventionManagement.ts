import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { InterventionData, PlantedSpecies, RegisterFormSliceInitalState, SampleTree } from 'src/types/interface/slice.interface'
import { createNewInterventionFolder } from 'src/utils/helpers/fileManagementHelper'
import useLogManagement from './useLogManagement'
import { FormElement } from 'src/types/interface/form.interface'
import { LAST_SCREEN } from 'src/types/type/app.type'

const useInterventionManagement = () => {
  const realm = useRealm()
  const { addNewLog } = useLogManagement()


  const initializeIntervention = async (
    interventoin: RegisterFormSliceInitalState,
  ): Promise<boolean> => {
    await createNewInterventionFolder(interventoin.form_id)
    const data: InterventionData = {
      form_id: interventoin.form_id,
      intervention_id: interventoin.form_id,
      intervention_key: interventoin.key,
      intervention_title: interventoin.title,
      intervention_date: interventoin.intervention_date,
      project_id: interventoin.project_id,
      project_name: interventoin.project_name,
      site_id: interventoin.site_id,
      site_name: interventoin.site_name,
      location_type: interventoin.location_type,
      location: {
        'type': `${interventoin.location_type}`,
        coordinates: ''
      },
      image: '',
      image_data: {
        latitude: 0,
        longitude: 0,
        imageUrl: '',
        cdnImageUrl: '',
        currentloclat: 0,
        currentloclong: 0,
        isImageUploaded: false,
        coordinateID: ''
      },
      has_species: interventoin.species_required,
      has_sample_trees: interventoin.has_sample_trees,
      sample_trees: [],
      is_complete: false,
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
      last_screen: 'FORM',
      planted_species: [],
      location_id: '',
      locate_tree: '',
      registration_date: interventoin.intervention_date
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
        message: 'New intervention added to db' + `(${interventoin.title}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return Promise.resolve(true)
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while creating intervention' + `(${interventoin.title}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false)
    }
  }





  const addNewIntervention = async (
    // interventoin: InterventionData,
  ): Promise<boolean> => {
    try {
      // realm.write(() => {
      //   realm.create(
      //     RealmSchema.Intervention,
      //     interventoin,
      //     Realm.UpdateMode.All,
      //   )
      // })
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
        intervention.last_screen = "TREE_DETAILS"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Sample Tree added to intervention' + `(${treeDetails.intervention_id}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while adding sample tree' + `(${treeDetails.intervention_id}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  // const updateInterventionCoverImage = async (imageURL: string, intervnetionID: string): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
  //       intervention.cover_image_url = imageURL
  //     });
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };

  // const deleteSampleTreeIntervention = async (treeId: string, intervnetionID: string): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
  //       const filterTress = intervention.sample_trees.filter(el => el.tree_id !== treeId)
  //       intervention.sample_trees = filterTress
  //     });
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };

  // const updateSampleTreeImage = async (intervnetionID: string, treeId: string, imageUrl: string): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
  //       const index = intervention.sample_trees.findIndex(el => el.tree_id === treeId)
  //       intervention.sample_trees[index].image_url = imageUrl
  //     });
  //     console.log("done writing")
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };

  const updateSampleTreeDetails = async (details: SampleTree): Promise<boolean> => {
    console.log("KLjdc", details)
    try {
      // realm.write(() => {
      //   const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, details.intervention_id);
      //   const index = intervention.sample_trees.findIndex(el => el.tree_id === details.tree_id)
      //   intervention.sample_trees[index] = { ...details }
      // });
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
      addNewLog({
        logType: 'INTERVENTION',
        message: `Intervention(${intervnetionID}) marked complete.`,
        logLevel: 'info',
        statusCode: ''
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: `Error occured while marking Intervention(${intervnetionID}) complete.`,
        logLevel: 'info',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  // const deleteIntervention = async (intervnetionID: string): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
  //       if (intervention) {
  //         realm.delete(intervention);
  //       }
  //     });
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };


  const updateSampleTreeSpecies = async (interventionID: string, treeId: string, speciesDetails: IScientificSpecies): Promise<boolean> => {
    try {
      console.log("KLjdc", interventionID, treeId, speciesDetails)

      // realm.write(() => {
      //   const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
      //   const index = intervention.sample_trees.findIndex(el => el.tree_id === treeId)
      //   intervention.sample_trees[index] = {
      //     ...intervention.sample_trees[index],
      //     specie_name: speciesDetails.scientificName,
      //     species_guid: speciesDetails.guid
      //   }
      // });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };


  // const deleteAllSyncedIntervention = async (): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const unSyncedObjects = realm.objects(RealmSchema.Intervention).filtered('status == "SYNCED"');
  //       realm.delete(unSyncedObjects);
  //     });
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };


  const updateInterventionLocation = async (intervnetionID: string, location: { type: string, coordinates: string }, isEntireSite: boolean, onlyUpadteLocation?: boolean): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.location = location
        intervention.entire_site = isEntireSite
        if (!onlyUpadteLocation) {
          intervention.last_screen = "LOCATION"
        }
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: `Location updated for Intervention-${intervnetionID}(${isEntireSite ? 'Entire Site' : location.type})`,
        logLevel: 'info',
        statusCode: ''
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while updating intervention location',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  const updateInterventionPlantedSpecies = async (intervnetionID: string, species: PlantedSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        const filteredSpecies = intervention.planted_species.filter(el => el.guid !== species.guid)
        intervention.planted_species = [...JSON.parse(JSON.stringify(filteredSpecies)), species]
        intervention.last_screen = "SPECIES"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Speices added to intervention' + `(${intervnetionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while adding intervention',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };


  const removeInterventionPlantedSpecies = async (intervnetionID: string, species: PlantedSpecies): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        const filteredSpecies = intervention.planted_species.filter(el => el.guid !== species.guid)
        intervention.planted_species = [...JSON.parse(JSON.stringify(filteredSpecies))]
        intervention.last_screen = "SPECIES"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Speices removed from intervention' + `(${intervnetionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while removing intervention',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  const updateLocalFormDetailsIntervention = async (intervnetionID: string, addData: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.form_data = addData
        intervention.last_screen = "LOCAL_FORM"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Additional form data added to intervention' + `(${intervnetionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while adding additional data',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };



  const updateDynamicFormDetails = async (intervnetionID: string, addData: FormElement[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.additional_data = addData
        intervention.last_screen = "DYNAMIC_FORM"
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Form data added to intervention' + `(${intervnetionID}).`,
        logLevel: 'info',
        statusCode: ''
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error w while adding form data',
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  const updateInterventionLastScreen = async (intervnetionID: string, screenName: LAST_SCREEN): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.last_screen = screenName
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Updated lastscreen for intervention' + `(${intervnetionID}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error while updating lastscreen for intervention' + `(${intervnetionID}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  const updateInterventionMetaData = async (intervnetionID: string, metaData: any,): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
        intervention.meta_data = metaData
      });
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Updated metadaa for intervention' + `(${intervnetionID}).`,
        logLevel: 'info',
        statusCode: '',
      })
      return Promise.resolve(true);
    } catch (error) {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error while updating metadata for intervention' + `(${intervnetionID}).`,
        logLevel: 'error',
        statusCode: '',
        logStack: JSON.stringify(error)
      })
      return Promise.reject(false);
    }
  };

  // const updateEditAdditionalData = async (intervnetionID: string, form_data: FormElement[], additional_data: FormElement[]): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
  //       intervention.form_data = form_data
  //       intervention.additional_data = additional_data
  //     });
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };

  // const updateInterventionStatus = async (intervnetionID: string, hid: string): Promise<boolean> => {
  //   try {
  //     realm.write(() => {
  //       const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, intervnetionID);
  //       intervention.status = 'SYNCED'
  //       intervention.hid = hid
  //     });
  //     return Promise.resolve(true);
  //   } catch (error) {
  //     console.error('Error during update:', error);
  //     return Promise.reject(false);
  //   }
  // };




  return { initializeIntervention, updateInterventionLocation, updateInterventionPlantedSpecies, updateSampleTreeSpecies, updateInterventionLastScreen, updateSampleTreeDetails, addSampleTrees, updateLocalFormDetailsIntervention, updateDynamicFormDetails, updateInterventionMetaData, saveIntervention, addNewIntervention, removeInterventionPlantedSpecies }
}

export default useInterventionManagement



