import {
  InterventionData,
  RegisterFormSliceInitalState,
} from 'src/types/interface/slice.interface'

export const getPreviewData = (data: RegisterFormSliceInitalState) => {
  const {intervention_date, title, project_name, site_name} = data
  let previewImage
  const basicInfo = {
    title,
    intervention_date,
    project_name,
    site_name,
  }
  //Preview Image
  if (data.cover_image_required) {
    previewImage = data.cover_image_url
  } else {
    previewImage = ''
  }

  //Intervention Date
  return {previewImage, basicInfo}
}

export const interventionFinalData = (data: RegisterFormSliceInitalState) => {
  const interventionLocation = makeInterventionGeoJson(
    data.location_type,
    data.coordinates,
  )
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
    cover_image_url: extractCoverImageUrl(data),
    has_species: data.species_required,
    species: data.species,
    has_sample_trees: false,
    sample_trees: data.tree_details,
    is_complete: false,
    site_id: data.site_id,
  }
  return finalData
}

export const makeInterventionGeoJson = (
  type: string,
  coordinates: any,
  isDisplay?: boolean,
) => {
  const coord: Array<[number, number]> = isDisplay
    ? coordinates
    : coordinates.map(({lat, long}) => [lat, long])

  switch (type) {
    case 'Point':
      return {
        geoJSON: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: coord[0],
          },
        },
        coordinates: JSON.stringify(coord),
        type,
      }
    case 'Polygon':
      return {
        geoJSON: {
          type: 'Feature',
          properties: {},
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

export const extractSpecies = (data: RegisterFormSliceInitalState) => {
  if (!data.is_multi_species) {
    return data.species[0]
  }
  return ''
}

export const extractTreeCount = (data: RegisterFormSliceInitalState) => {
  if (!data.is_multi_species) {
    return 1
  }
  return 1
}

export const extractCoverImageUrl = (data: RegisterFormSliceInitalState) => {
  if (data.cover_image_required) {
    return data.cover_image_url
  }
  return ''
}

export const extractTreeImageUrl = (data: RegisterFormSliceInitalState) => {
  if (data.tree_image_required) {
    return data.tree_image_url
  }
  return data.cover_image_url
}
