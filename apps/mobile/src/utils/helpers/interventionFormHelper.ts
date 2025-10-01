import {
  InterventionData,
  RegisterFormSliceInitialState,
} from 'src/types/interface/slice.interface'
import { FormElement } from 'src/types/interface/form.interface'
import { Colors } from '../constants'
import { setUpIntervention } from './formHelper/selectIntervention'
import { RootStackParamList } from 'src/types/type/navigation.type'
export const getPreviewData = (data: RegisterFormSliceInitialState) => {
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
            ...extra || {}
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
            ...extra || {}
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


export const getInterventionColor = (key) => {
  switch (key) {
    case 'single-tree-registration':
      return Colors.SINGLE_TREE;
    case 'multi-tree-registration':
      return Colors.MULTI_TREE;
    case 'removal-invasive-species':
      return Colors.INVASIVE_SPECIES;
    case 'fire-suppression':
      return Colors.FIRE_SUPPRESSION;
    case 'fire-patrol':
      return Colors.FIRE_PATROL;
    case 'fencing':
      return Colors.FENCING;
    case 'marking-regenerant':
      return Colors.MARKING_REGENERANT;
    case 'liberating-regenerant':
      return Colors.LIBERATING_REGENERANT;
    case 'grass-suppression':
      return Colors.GRASS_SUPPRESSION;
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
    case 'enrichment-planting':
      return Colors.ENRICHMENT_PLANTING;
    case 'other-intervention':
      return Colors.OTHER_INTERVENTION;
    case 'maintenance':
      return Colors.MAINTENANCE;
    default:
      return Colors.SINGLE_TREE;
  }
}

type NavigationResult = {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

export const lastScreenNavigationHelper = (data: InterventionData): NavigationResult => {
  const formData = setUpIntervention(data.intervention_key);
  let result : NavigationResult;
  switch (data.last_screen) {
    case "FORM":
      if (formData.location_type === 'Point') {
        result = { screen: 'PointMarker', params: { id: data.intervention_id } };
      }
      if (formData.location_type === 'Polygon') {
        result = { screen: 'PolygonMarker', params: { id: data.intervention_id } };
      }
      break;

    case "LOCATION":
      if (formData.species_required) {
        result = { screen: 'ManageSpecies', params: { manageSpecies: false, id: data.intervention_id } };
      }
      if (!formData.species_required) {
        result = { screen: 'LocalForm', params: { id: data.intervention_id } };
      }
      break;

    case "SPECIES":
      if (formData.tree_details_required) {
        if (!formData.is_multi_species) {
          result = { screen: 'ReviewTreeDetails', params: { id: data.intervention_id } };
          break;
        }
        result = { screen: 'ManageSpecies', params: { manageSpecies: false, id: data.intervention_id } };
      }
      break;
    case "TOTAL_TREES":
      result = { screen: 'ReviewTreeDetails', params: { id: data.intervention_id } };
      break;
    case "TREE_DETAILS":
      result = { screen: 'LocalForm', params: { id: data.intervention_id } };
      break;
    case "LOCAL_FORM":
      result = { screen: 'DynamicForm', params: { id: data.intervention_id } };
      break;
    case "DYNAMIC_FORM":
      result = { screen: 'InterventionPreview', params: { id: 'review', intervention: '', interventionId: data.intervention_id } };
      break;
    default:
      result = { screen: 'InterventionPreview', params: { id: 'preview', intervention: data.intervention_id, interventionId: data.intervention_id } };
  }
  if (Object.keys(result).length === 0) {
    result = { screen: 'InterventionPreview', params: { id: 'preview', intervention: data.intervention_id, interventionId: data.intervention_id } };
  }
  return result
}

export const metaDataTransformer = (existingData: any, data: { public: any, private: any, app: any }) => {
  const finalData = { ...existingData }
  if (existingData['public']) {
    finalData['public'] = { ...existingData['public'], ...data.public }
  } else {
    finalData['public'] = { ...data.public }
  }

  if (existingData['private']) {
    finalData['private'] = { ...existingData['private'], ...data.private }
  } else {
    finalData['private'] = { ...data.private }
  }

  if (existingData['app']) {
    finalData['app'] = { ...existingData['app'], ...data.app }
  } else {
    finalData['app'] = { ...data.app }
  }
  return JSON.stringify(finalData)
} 