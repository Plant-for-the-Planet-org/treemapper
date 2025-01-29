import moment from 'moment'
import {
  BodyPayload,
  MonitoringPlot,
  PlantedPlotSpecies,
  PlotObservation,
  PlotQuaeBody,
} from 'src/types/interface/slice.interface'
import * as turf from '@turf/turf'
import {appRealm} from 'src/db/RealmProvider'
import {RealmSchema} from 'src/types/enum/db.enum'

const postTimeConvertor = (t: number) => {
  return moment(t).format('YYYY-MM-DD')
}

/**
 * Finds the center of a polygon based on its shape type and geometry
 * @param {Object} feature - GeoJSON Feature containing the polygon
 * @param {string} shape - Shape type ('rectangle', 'square', or 'circle')
 * @returns {Array} Center coordinates [longitude, latitude]
 */
function findPolygonCenter(feature, shape) {
  if ((!feature && !feature.geometry) || feature.geometry.type !== 'Polygon') {
    throw new Error('Invalid input: Feature must be a GeoJSON Polygon')
  }

  if (!['rectangle', 'square', 'circular'].includes(shape.toLowerCase())) {
    throw new Error('Invalid shape type: Must be rectangle, square, or circle')
  }
  let result = []
  switch (shape.toLowerCase()) {
    case 'circular': {
      // For circles, use turf.center as it will find the center of mass
      const center = turf.center(feature)
      result = center.geometry.coordinates
      break
    }

    case 'rectangle':
    case 'square': {
      // For rectangles and squares, we can use the bounding box center
      // This is more accurate than center of mass for these shapes
      const bbox = turf.bbox(feature)
      const centerLong = (bbox[0] + bbox[2]) / 2
      const centerLat = (bbox[1] + bbox[3]) / 2
      result = [centerLong, centerLat]
      break
    }
    default: {
      result = []
    }
  }
  return result
}

export const postPlotConvertor = (d: MonitoringPlot[]) => {
  const quae: PlotQuaeBody[] = []
  d.forEach(plot => {
    if (plot.status === 'UPLOAD_PLOT') {
      quae.push({
        type: 'plot_upload',
        priority: 1,
        nextStatus: 'SYNCED',
        parentID: plot.plot_id,
        uploadID: plot.plot_id,
      })
    }
  })
  return quae
}

export const postPlotInterventionConvertor = (
  d: PlantedPlotSpecies[],
) => {
  const quae: PlotQuaeBody[] = []
  d.forEach(plant => {
    if (plant.status === 'UPLOAD_REQUIRED') {
      quae.push({
        type: 'plot_intervention_upload',
        priority: 2,
        nextStatus: 'SYNCED',
        parentID: plant.plot_id,
        uploadID: plant.plot_plant_id,
      })
    }
  })
  return quae
}

export const postPlotObservationConvertor = (
  d: PlotObservation[],
) => {
  const quae: PlotQuaeBody[] = []
  d.forEach(obs => {
    if (obs.status === 'UPLOAD_REQUIRED') {
      quae.push({
        type: 'plot_observation_upload',
        priority: 2,
        nextStatus: 'SYNCED',
        parentID: obs.plot_id,
        uploadID: obs.obs_id,
      })
    }
  })
  return quae
}

const plotShapeHelper = (p: MonitoringPlot) => {
  if (p.shape === 'RECTANGULAR') {
    return {
      length: p.length,
      width: p.width,
    }
  }
  return {
    radius: p.radius,
  }
}

const plotCenterFinder = (p: MonitoringPlot) => {
  const center = findPolygonCenter(
    {
      type: 'Feature',
      properties: {},
      geometry: {
        coordinates: JSON.parse(p.location.coordinates),
        type: 'Polygon',
      },
    },
    p.shape,
  )

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [...center],
      type: 'Point',
    },
  }
}

export const getPlotPostBody = async (
  r: PlotQuaeBody,
): Promise<BodyPayload> => {
  try {
    const PlotData = appRealm.objectForPrimaryKey<MonitoringPlot>(
      RealmSchema.MonitoringPlot,
      r.uploadID,
    )
    const plotDimensions = plotShapeHelper(PlotData)
    const plotGeometry = plotCenterFinder(PlotData)
    const postData: any = {
      type: PlotData.type.toLowerCase(),
      shape: PlotData.shape.toLocaleLowerCase(),
      name: PlotData.name,
      ...plotDimensions,
      geometry: {...plotGeometry},
      captureDate: postTimeConvertor(PlotData.plot_created_at),
    }
    return {
      pData: postData,
      message: '',
      fixRequired: 'NO',
      error: '',
      urlID: PlotData.server_id,
    }
  } catch (error) {
    return {pData: null, message: '', fixRequired: 'NO', error: '', urlID: ''}
  }
}

export const getPlotInterventionBody = async (
  r: PlotQuaeBody,
): Promise<BodyPayload> => {
  try {
    const PlotData = appRealm.objectForPrimaryKey<MonitoringPlot>(
      RealmSchema.MonitoringPlot,
      r.parentID,
    )
    if (PlotData.server_id === '') {
      return {pData: null, message: '', fixRequired: 'NO', error: ''}
    }
    const PlantData = appRealm.objectForPrimaryKey<PlantedPlotSpecies>(
      RealmSchema.PlotPlantedSpecies,
      r.uploadID,
    )

    const postData: any = {
      isRecruit: PlantData.type === 'RECRUIT',
      tag: PlantData.tag,
      interventionStartDate: postTimeConvertor(PlantData.planting_date),
      interventionEndDate: postTimeConvertor(PlantData.planting_date),
      geometry: {
        type: 'Point',
        coordinates: [PlantData.latitude, PlantData.longitude],
      },
      measurements: {
        height: PlantData.timeline[0].length,
        width: PlantData.timeline[0].width,
      },
      captureMode: 'on-site',
      deviceLocation: {
        coordinates: [73.77440575566384, 18.49951042415884],
        type: 'Point',
      },
      metadata: {
        public: [{}],
        private: [{}],
        app: {
          deviceLocation: {
            coordinates: [73.77440575566384, 18.49951042415884],
            type: 'Point',
          },
        },
      },
    }

    if (PlantData.scientificName === 'Unknown') {
      postData.otherSpecies = 'unknown'
    } else {
      postData.scientificSpecies = PlantData.guid
    }

    return {
      pData: postData,
      message: '',
      fixRequired: 'NO',
      error: '',
      urlID: PlotData.server_id,
    }
  } catch (error) {
    console.log('KLJK', error)
    return {pData: null, message: '', fixRequired: 'NO', error: ''}
  }
}

export const getPlotObservationBody = async (
  r: PlotQuaeBody,
): Promise<BodyPayload> => {
  try {
    const PlotData = appRealm.objectForPrimaryKey<MonitoringPlot>(
      RealmSchema.MonitoringPlot,
      r.parentID,
    )
    if (PlotData.server_id === '') {
      return {pData: null, message: '', fixRequired: 'NO', error: ''}
    }
    const ObservationData = appRealm.objectForPrimaryKey<PlotObservation>(
      RealmSchema.PlotObservation,
      r.uploadID,
    )

    const observationTypeData = () => {
      switch (ObservationData.type) {
        case 'CANOPY':
          return 'canopy'
        case 'SOIL_MOISTURE':
          return 'soil-moisture'
        case 'BIOACOUSTICS':
          return 'bioacoustics'
        default:
          return 'canopy'
      }
    }

    const postData: any = {
      type: observationTypeData(),
      observationDate: postTimeConvertor(ObservationData.obs_date),
      captureDate: postTimeConvertor(Date.now()),
      unit: ObservationData.unit,
      value: ObservationData.value,
    }
    return {
      pData: postData,
      message: '',
      fixRequired: 'NO',
      error: '',
      urlID: PlotData.server_id,
    }
  } catch (error) {
    return {pData: null, message: '', fixRequired: 'NO', error: ''}
  }
}
