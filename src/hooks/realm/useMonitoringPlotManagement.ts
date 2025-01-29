import {useRealm, Realm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import {
  MonitoringPlot,
  PlantTimeLine,
  PlantedPlotSpecies,
  PlotGroups,
  PlotObservation,
} from 'src/types/interface/slice.interface'
import {PLOT_PLANT_STATUS} from 'src/types/type/app.type'

export interface PlotDetailsParams {
  name: string
  length: number
  width: number
  radius: number
  group: null
}

const useMonitoringPlotManagement = () => {
  const realm = useRealm()

  const initializeNewPlot = async (
    plotDetails: MonitoringPlot,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.MonitoringPlot,
          plotDetails,
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotDetails = async (
    id: string,
    data: PlotDetailsParams,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.name = data.name
        plotData.length = data.length
        plotData.width = data.width
        plotData.radius = data.radius
        plotData.lastScreen = 'details'
        if (plotData.server_id !== '') {
          plotData.status = 'UPDATE_PLOT'
        }
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotLocation = async (
    id: string,
    coordinate: Array<number[]>,
    isEdit: boolean,
    dimensions?: {
      h: number
      w: number
      r: number
    },
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.location = {
          type: 'Polygon',
          coordinates: JSON.stringify(coordinate),
        }
        plotData.coords = {
          type: 'Point',
          coordinates: [coordinate[0][0][0]],
        }
        plotData.lastScreen = 'location'
        plotData.is_complete = true
        if (isEdit) {
          plotData.length = dimensions.h
          plotData.width = dimensions.w
          plotData.radius = dimensions.r
          plotData.status = 'UPDATE_PLOT'
        } else {
          plotData.status = 'UPLOAD_PLOT'
        }
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotImage = async (
    id: string,
    image: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.local_image = image
        if (plotData.server_id !== '') {
          plotData.status = 'UPDATE_PLOT'
        }
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const addPlantDetailsPlot = async (
    id: string,
    plantDetails: PlantedPlotSpecies,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.plot_plants = [...plotData.plot_plants, {...plantDetails}]
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotPlantLocation = async (
    id: string,
    plantId: string,
    lat: number,
    long: number,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const plantIndex = plotData.plot_plants.findIndex(
          el => el.plot_plant_id === plantId,
        )
        plotData.plot_plants[plantIndex].latitude = lat
        plotData.plot_plants[plantIndex].longitude = long
        plotData.plot_plants[plantIndex].is_complete = true
        if (plotData.plot_plants[plantIndex].server_id!=='') {
          plotData.plot_plants[plantIndex].status = 'EDITED'
        }else{
          plotData.plot_plants[plantIndex].status = 'UPLOAD_REQUIRED'
        }
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotName = async (id: string, name: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.name = name
        if (plotData.server_id !== '') {
          plotData.status = 'UPDATE_PLOT'
        }
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const deleteMonitoringPlot = async (plotID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          plotID,
        )
        if (plot) {
          realm.delete(plot)
        }
      })
      return true
    } catch (error) {
      console.error('Error during update:', error)
      return false
    }
  }

  const deletePlotGroup = async (gid: string): Promise<boolean> => {
    try {
      const plotList = []
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(
          RealmSchema.PlotGroups,
          gid,
        )
        groupData.plots.forEach(el => plotList.push(el.plot_id))
        realm.delete(groupData)
      })
      realm.write(() => {
        plotList.forEach(el => {
          const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
            RealmSchema.MonitoringPlot,
            el,
          )
          plotData.plot_updated_at = Date.now()
        })
      })
      return true
    } catch (error) {
      console.error('Error during update:', error)
      return false
    }
  }

  const addNewMeasurementPlantPlots = async (
    id: string,
    plantId: string,
    timeLine: PlantTimeLine,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const index = plotData.plot_plants.findIndex(
          el => el.plot_plant_id === plantId,
        )
        plotData.plot_plants[index].timeline.push(timeLine)
        plotData.plot_updated_at = Date.now()
        plotData.plot_plants[index].is_alive = timeLine.status !== 'DECEASED'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updateTimelineDetails = async (
    id: string,
    plantId: string,
    timelineId: string,
    details: {
      l: number
      w: number
      date: number
      status: PLOT_PLANT_STATUS
    },
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const index = plotData.plot_plants.findIndex(
          el => el.plot_plant_id === plantId,
        )
        const timelineDetails = plotData.plot_plants[index].timeline.find(
          el => el.timeline_id === timelineId,
        )
        timelineDetails.date = details.date
        timelineDetails.length = details.l
        timelineDetails.width = details.w
        timelineDetails.status = details.status
        plotData.plot_updated_at = Date.now()
        plotData.plot_plants[index].is_alive = details.status !== 'DECEASED'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const deletePlotTimeline = async (
    id: string,
    plantId: string,
    timelineId: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const index = plotData.plot_plants.findIndex(
          el => el.plot_plant_id === plantId,
        )
        const timelineDetails = plotData.plot_plants[index].timeline.find(
          el => el.timeline_id === timelineId,
        )
        plotData.plot_plants[index].timeline = plotData.plot_plants[
          index
        ].timeline.filter(el => timelineDetails.timeline_id !== el.timeline_id)
        plotData.plot_updated_at = Date.now()
        plotData.plot_plants[index].is_alive =
          timelineDetails.status === 'DECEASED'
            ? true
            : plotData.plot_plants[index].is_alive
        realm.delete(timelineDetails)
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotPlatDetails = async (
    id: string,
    plantId: string,
    updatedDetails: {
      tag: string
      type: any
      species: {
        guid: string
        scientificName: string
        aliases: string
      }
    },
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const index = plotData.plot_plants.findIndex(
          el => el.plot_plant_id === plantId,
        )
        plotData.plot_plants[index].scientificName =
          updatedDetails.species.scientificName
        plotData.plot_plants[index].guid = updatedDetails.species.guid
        plotData.plot_plants[index].aliases = updatedDetails.species.aliases
        plotData.plot_plants[index].tag = updatedDetails.tag
        plotData.plot_plants[index].type = updatedDetails.type
        plotData.plot_plants[index].details_updated_at = Date.now()
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const deletePlantDetails = async (
    id: string,
    plantId: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotDetails = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const plantDetails = plotDetails.plot_plants.find(
          el => el.plot_plant_id === plantId,
        )
        const filteredData = plotDetails.plot_plants.filter(
          el => el.plot_plant_id !== plantId,
        )
        plotDetails.plot_plants = filteredData
        realm.delete(plantDetails)
        plotDetails.plot_updated_at = Date.now()
      })
      return true
    } catch (error) {
      console.error('Error during update:', error)
      return false
    }
  }

  const addPlotObservation = async (
    id: string,
    observationDEtails: PlotObservation,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.observations = [
          ...plotData.observations,
          {...observationDEtails},
        ]
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotObservation = async (
    id: string,
    observationDEtails: PlotObservation,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const observation = realm.objectForPrimaryKey<PlotObservation>(
          RealmSchema.PlotObservation,
          observationDEtails.obs_id,
        )
        observation.obs_date = observationDEtails.obs_date
        observation.type = observationDEtails.type
        observation.value = observationDEtails.value
        observation.unit = observationDEtails.unit
        observation.status = observationDEtails.status
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const deletePlotObservation = async (
    id: string,
    obsId: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        const observation = realm.objectForPrimaryKey<PlotObservation>(
          RealmSchema.PlotObservation,
          obsId,
        )
        realm.delete(observation)
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const createNewPlotGroup = async (
    groupDetails: PlotGroups,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(RealmSchema.PlotGroups, groupDetails, Realm.UpdateMode.All)
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const editGroupName = async (id: string, name: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(
          RealmSchema.PlotGroups,
          id,
        )
        groupData.name = name
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const addPlotToGroup = async (
    gid: string,
    plot: MonitoringPlot,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(
          RealmSchema.PlotGroups,
          gid,
        )
        const cleanData = groupData.plots.filter(
          el => el.plot_id !== plot.plot_id,
        )
        groupData.plots = [...cleanData, plot]
        groupData.details_updated_at = Date.now()
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          plot.plot_id,
        )
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const removePlotFromGroup = async (
    gid: string,
    plot_id: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(
          RealmSchema.PlotGroups,
          gid,
        )
        groupData.plots = groupData.plots.filter(el => el.plot_id !== plot_id)
        groupData.details_updated_at = Date.now()
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          plot_id,
        )
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  //server
  const updatePlotDetailsServer = async (
    id: string,
    hid: string,
    server_id: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(
          RealmSchema.MonitoringPlot,
          id,
        )
        plotData.server_id = server_id
        plotData.hid = hid
        plotData.status = 'SYNCED'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotInterventionServer = async (
    id: string,
    server_id: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plantData = realm.objectForPrimaryKey<PlantedPlotSpecies>(
          RealmSchema.PlotPlantedSpecies,
          id,
        )
        plantData.server_id = server_id
        plantData.status = 'SYNCED'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updatePlotObservationServer = async (
    id: string,
    server_id: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plantData = realm.objectForPrimaryKey<PlotObservation>(
          RealmSchema.PlotObservation,
          id,
        )
        plantData.server_id = server_id
        plantData.status = 'SYNCED'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }


  return {
    updatePlotObservation,
    deletePlotObservation,
    deletePlotTimeline,
    updateTimelineDetails,
    deletePlantDetails: deletePlantDetails,
    updatePlotPlatDetails,
    updatePlotName,
    deletePlotGroup,
    updatePlotPlantLocation,
    removePlotFromGroup,
    addPlotToGroup,
    editGroupName,
    createNewPlotGroup,
    deleteMonitoringPlot,
    initializeNewPlot,
    addPlotObservation,
    updatePlotDetails,
    updatePlotLocation,
    updatePlotImage,
    addPlantDetailsPlot,
    addNewMeasurementPlantPlots,
    updatePlotDetailsServer,
    updatePlotInterventionServer,
    updatePlotObservationServer,
  }
}

export default useMonitoringPlotManagement
