import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies, PlotGroups, PlotObservation } from 'src/types/interface/slice.interface'


export interface PlotDetailsParams {
  name: string,
  length: number,
  width: number,
  radius: number,
  group: null
}




const useMonitoringPlotMangement = () => {
  const realm = useRealm()
  const initateNewPlot = async (
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
      return Promise.reject(false)
    }
  }

  const updatePlotDetails = async (
    id: string,
    data: PlotDetailsParams
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.name = data.name
        plotData.length = data.length
        plotData.width = data.width
        plotData.radius = data.radius
        plotData.lastScreen = 'details'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const updatePlotLocation = async (
    id: string,
    coordinate: Array<number[]>
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.location = {
          type: 'Polygon',
          coordinates: JSON.stringify(coordinate)
        }
        plotData.coords = {
          type: 'Point',
          coordinates: [coordinate[0][0][0]]
        }
        plotData.lastScreen = 'location'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const updatePlotImage = async (
    id: string,
    image: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.local_image = image
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const addPlantDetailsPlot = async (
    id: string,
    plantDetails: PlantedPlotSpecies
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.plot_plants = [...plotData.plot_plants, { ...plantDetails }]
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const upatePlotPlantLocation = async (
    id: string,
    plantId: string,
    lat: number,
    long: number
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const plantIndex = plotData.plot_plants.findIndex(el => el.plot_plant_id === plantId)
        plotData.plot_plants[plantIndex].latitude = lat
        plotData.plot_plants[plantIndex].longitude = long
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }


  const delteMonitoringPlot = async (plotID: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plot) {
          realm.delete(plot);
        }
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };


  const addNewMeasurmentPlantPlots = async (
    id: string,
    plantId: string,
    timeLine: PlantTimeLine
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const index = plotData.plot_plants.findIndex(el => el.plot_plant_id === plantId)
        plotData.plot_plants[index].timeline.push(timeLine)
        plotData.plot_updated_at = Date.now()
        plotData.plot_plants[index].is_alive = timeLine.status !== 'DESCEASED'
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }
  const addPlotObservation = async (
    id: string,
    observationDEtails: PlotObservation
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.observations = [...plotData.observations, { ...observationDEtails }]
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const createNewPlotGroup = async (
    groupDetails: PlotGroups,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.PlotGroups,
          groupDetails,
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const editGroupName = async (
    id: string,
    name: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, id);
        groupData.name = name
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const addPlotToGroup = async (
    gid: string,
    plot: MonitoringPlot,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        groupData.plots.push(plot);
        groupData.details_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const removePlotFromGroup = async (
    gid: string,
    plot_id: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        groupData.plots = groupData.plots.filter(el => el.plot_id !== plot_id)
        groupData.details_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }



  return { upatePlotPlantLocation, removePlotFromGroup, addPlotToGroup, editGroupName, createNewPlotGroup, delteMonitoringPlot, initateNewPlot, addPlotObservation, updatePlotDetails, updatePlotLocation, updatePlotImage, addPlantDetailsPlot, addNewMeasurmentPlantPlots }
}

export default useMonitoringPlotMangement



