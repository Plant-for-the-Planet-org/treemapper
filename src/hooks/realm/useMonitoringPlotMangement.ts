import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies, PlotObservation } from 'src/types/interface/slice.interface'


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



  return { initateNewPlot, addPlotObservation, updatePlotDetails, updatePlotLocation, updatePlotImage, addPlantDetailsPlot, addNewMeasurmentPlantPlots }
}

export default useMonitoringPlotMangement



