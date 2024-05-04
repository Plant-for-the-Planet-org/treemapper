import {
  InterventionData,
  RegisterFormSliceInitalState,
  SampleTreeSlice,
} from 'src/types/interface/slice.interface'
import { FormElement } from 'src/types/interface/form.interface'
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
) => {
  const interventionLocation = makeInterventionGeoJson(
    data.location_type,
    data.coordinates,
    data.form_id,
  )
  const additional_data = convertAdditionalData(data)
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
    meta_data: '',
    status: 'NOT_SYNCED',
    hid: '',
    coords: {
      type: 'Point',
      coordinates: data.coordinates[0]
    }
  }
  return finalData
}

export const makeInterventionGeoJson = (
  type: string,
  coordinates: Array<number[]>,
  id: string,
) => {
  const coord: Array<number[]> = coordinates
  switch (type) {
    case 'Point':
      return {
        geoJSON: {
          type: 'Feature',
          properties: {
            id,
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

const convertInterventionFormData = (d: FormElement[]) => {
  const data = {}
  d.forEach(el => {
    data[el.key] = {
      value: el.value,
      label: el.label
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


