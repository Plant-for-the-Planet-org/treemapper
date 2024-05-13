import {
  InterventionData,
  RegisterFormSliceInitalState,
  SampleTreeSlice,
} from 'src/types/interface/slice.interface'
import { FormElement } from 'src/types/interface/form.interface'
import { Colors } from '../constants'
import { Metadata } from 'src/types/interface/app.interface'
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
  let additional_data = convertAdditionalData(data)
  if (data.additional_data.length > 0) {
    const exsitingData = additional_data.length > 0 ? JSON.parse(additional_data) : [];
    additional_data = JSON.stringify({ ...exsitingData, ...JSON.parse(data.additional_data) })
  }
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
    cover_image_url: data.cover_image_url,
    has_species: data.species_required,
    species: data.species,
    has_sample_trees: data.has_sample_trees,
    sample_trees: data.tree_details,
    is_complete: false,
    site_id: data.site_id,
    intervention_type: data.key,
    form_data: JSON.stringify(data.form_data),
    additional_data: additional_data,
    meta_data: tranformedMetaData,
    status: 'NOT_SYNCED',
    hid: '',
    coords: {
      type: 'Point',
      coordinates: data.coordinates[0]
    },
    entire_site: data.entire_site_selected
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

const convertAdditionalData = (d: RegisterFormSliceInitalState) => {
  const form_data = convertInterventionFormData(d.form_data)
  // let deviceLocation = {
  //   label: "Device Location",
  //   value: ""
  // };

  // if (lat && long) {
  //   deviceLocation.value = `${long.toFixed(6)},${lat.toFixed(6)}`
  // }

  return JSON.stringify({
    ...form_data
  })
}


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
    ...{public:data}
  })
}




export const extractSpecies = (
  data: SampleTreeSlice,
) => {
  const speciesDetails = data.species.filter(el => el.info.guid === data.current_species)
  return { species_details: speciesDetails[0].info, treeCount: speciesDetails[0].count }
}

export const extractTreeCount = (
  sampleTree: SampleTreeSlice | null,
  current_species: string,
) => {
  if (sampleTree) {
    const matchingItem = sampleTree.species.find(
      item => item.info.guid === current_species,
    )
    return matchingItem.count
  }
  return 1
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