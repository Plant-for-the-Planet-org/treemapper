import {
  InterventionData,
  RegisterFormSliceInitalState,
} from 'src/types/interface/slice.interface'
import { FormElement } from 'src/types/interface/form.interface'
import { Colors } from '../constants'
import { Metadata } from 'src/types/interface/app.interface'
import { setUpIntervention } from './formHelper/selectIntervention'
import { RootStackParamList } from 'src/types/type/navigation.type'
export const getPreviewData = (data: RegisterFormSliceInitalState) => {
  const { intervention_date, title, project_name, site_name } = data

  const basicInfo = {
    title,
    intervention_date,
    project_name,
    site_name,
  }
  //Preview Image
  const previewImage = ''
  //Intervention Date
  return { previewImage, basicInfo }
}

export const convertFormDataToIntervention = (
  data: RegisterFormSliceInitalState,
  meta_data: Metadata[]
) => {
  const interventionLocation = makeInterventionGeoJson(
    data.location_type,
    data.coordinates,
    data.form_id,
  )
  // let additional_data = convertAdditionalData(data)
  // if (data.additional_data.length > 0) {
  //   const exsitingData = additional_data.length > 0 ? JSON.parse(additional_data) : [];
  //   additional_data = JSON.stringify({ ...exsitingData, ...JSON.parse(data.additional_data) })
  // }
  const tranformedMetaData = convertMetaData(meta_data);
  const finalData: InterventionData = {
    intervention_id: data.form_id,
    intervention_key: data.key,
    intervention_title: data.title,
    intervention_date: data.intervention_date,
    project_id: data.project_id,
    project_name: data.project_name,
    site_name: data.site_name,
    location_type: data.location_type,
    location: {
      type: interventionLocation.type,
      coordinates: interventionLocation.coordinates,
    },
    image: data.cover_image_url,
    has_species: data.species_required,
    has_sample_trees: data.has_sample_trees,
    sample_trees: data.tree_details,
    is_complete: false,
    site_id: data.site_id,
    intervention_type: data.key,
    form_data: data.form_data,
    additional_data: data.additional_data,
    meta_data: tranformedMetaData,
    status: 'INIIALIZED',
    hid: '',
    coords: {
      type: 'Point',
      coordinates: data.coordinates[0]
    },
    entire_site: data.entire_site_selected,
    last_screen: 'FORM',
    planted_species: data.plantedSpecies,
    form_id: '',
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
    location_id: '',
    locate_tree: '',
    registration_date: 0,
    remeasuremnt_required: false,
    next_measurement_date: 0
  }
  return finalData
}

export const makeInterventionGeoJson = (
  type: string,
  coordinates: Array<number[]>,
  id: string,
  extra?: any
) => {
  const coord: Array<number[]> = coordinates
  switch (type) {
    case 'Point':
      return {
        geoJSON: {
          type: 'Feature',
          properties: {
            id,
            ...extra ? extra : {}
          },
          geometry: {
            type: 'Point',
            coordinates: [...coord[0]],
          },
        },
        coordinates: JSON.stringify(coord),
        type,
      }
    case 'Polygon':
      return {
        geoJSON: {
          type: 'Feature',
          properties: {
            id,
            ...extra ? extra : {}
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coord],
          },
        },
        coordinates: JSON.stringify(coord),
        type,
      }
    default:
      return {
        geoJSON: {},
        coordinates: '',
        type: '',
      }
  }
}

export const convertInterventionFormData = (d: FormElement[]) => {
  const data = {}
  d.forEach(el => {
    data[el.key] = {
      value: el.value,
      label: el.label,
      type: el.type
    }
  })
  return data;
}

// const convertAdditionalData = (d: RegisterFormSliceInitalState) => {

//   // const form_data = convertInterventionFormData(d.form_data)
//   // let deviceLocation = {
//   //   label: "Device Location",
//   //   value: ""
//   // };

//   // if (lat && long) {
//   //   deviceLocation.value = `${long.toFixed(6)},${lat.toFixed(6)}`
//   // }
// //ToDO
//   // return JSON.stringify({
//     //   ...form_data
//     // })
//     return ''
//   }


const convertMetaData = (d: Metadata[]) => {
  if (d.length == 0) {
    return ''
  }
  const data = {}
  d.forEach(el => {
    data[el.key] = {
      value: el.value,
      label: el.key,
    }
  })
  return JSON.stringify({
    ...{ public: data }
  })
}





export const getInterventionColor = (key) => {
  switch (key) {
    case 'single-tree-registration':
      return Colors.SINGLE_TREE;
    case 'multi-tree-registration':
      return Colors.MULTI_TREE;
    case 'removal-invasive-species':
      return Colors.INVASIVE_SPECIES;
    case 'fire-suppression':
      return Colors.FIRE_SUPRESSION;
    case 'fire-patrol':
      return Colors.FIRE_PATROL;
    case 'fencing':
      return Colors.FENCING;
    case 'marking-regenerant':
      return Colors.MARKING_REGENERANT;
    case 'liberating-regenerant':
      return Colors.LIBERATING_REGENERANT;
    case 'grass-suppression':
      return Colors.GRASS_SUPRESSION;
    case 'firebreaks':
      return Colors.FIREBREAKS;
    case 'assisting-seed-rain':
      return Colors.SEED_RAIN;
    case 'soil-improvement':
      return Colors.SOIL_IMPROVEMENT;
    case 'stop-tree-harvesting':
      return Colors.STOP_HARVESTING;
    case 'direct-seeding':
      return Colors.DIRECT_SEEDING;
    case 'enrichement-planting':
      return Colors.ENRICHMENT_PLANTING;
    case 'other-intervention':
      return Colors.OTHER_INTERVENTION;
    case 'maintenance':
      return Colors.MAINTAINEANCE;
    default:
      return Colors.SINGLE_TREE;
  }
}

type NavigationResult = {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

export const lastScreenNavigationHelper=(data:InterventionData):NavigationResult=>{
  const formData = setUpIntervention(data.intervention_key)
  if (data.last_screen === "FORM") {
    if (formData.location_type === 'Point') {
      return { screen: 'PointMarker', params: {id:data.intervention_id} }
    }
    if (formData.location_type === 'Polygon') {
      return { screen: 'PolygonMarker', params: {id:data.intervention_id} }
    }
  }


  //location select
  if (data.last_screen === "LOCATION") {
    if (formData.species_required) {
      return { screen: 'ManageSpecies', params: { manageSpecies: false ,id:data.intervention_id} }
    }
  }

  //species select
  if (data.last_screen === "SPECIES") {
    if (formData.tree_details_required && !formData.is_multi_species) {
      return { screen: 'ReviewTreeDetails', params: {id:data.intervention_id} }
    }
    if (formData.tree_details_required && formData.is_multi_species) {
      return { screen: 'ManageSpecies', params: { manageSpecies: false,id:data.intervention_id} }
    }
  }


  if (data.last_screen === "TOTAL_TREES") {
    return { screen: 'ReviewTreeDetails', params: { id:data.intervention_id} }
  }


  //treeDetails select
  if (data.last_screen === "TREE_DETAILS") {
    return { screen: 'LocalForm', params: {id:data.intervention_id} }
  }


  if (data.last_screen === "LOCATION") {
    if (!formData.species_required) {
      return { screen: 'LocalForm', params: {id:data.intervention_id} }
    }
  }


  //localForm select
  if (data.last_screen === 'LOCAL_FORM') {
    return { screen: 'DynamicForm', params: {id:data.intervention_id} }
  }

  if (data.last_screen === 'DYNAMIC_FORM') {
    return { screen: 'InterventionPreview', params: { id: 'review', intervention: '' ,interventionId:data.intervention_id} }
  }

  return { screen: 'InterventionPreview', params: { id: 'preview', intervention: data.intervention_id,interventionId:data.intervention_id } }

}


export const metaDataTranformer = (exsitingData: any, data: { public: any, private: any, app: any }) => {
  const finalData = { ...exsitingData }
  if (exsitingData['public']) {
    finalData['public'] = { ...exsitingData['public'], ...data.public }
  } else {
    finalData['public'] = { ...data.public }
  }

  if (exsitingData['private']) {
    finalData['private'] = { ...exsitingData['private'], ...data.private }
  } else {
    finalData['private'] = { ...data.private }
  }

  if (exsitingData['app']) {
    finalData['app'] = { ...exsitingData['app'], ...data.app }
  } else {
    finalData['app'] = { ...data.app }
  }
  return JSON.stringify(finalData)
} 