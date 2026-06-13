import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies, PlotGroups, PlotObservation } from 'src/types/interface/slice.interface'
import { PLOT_PLANT_STATUS } from 'src/types/type/app.type'
import { generateUid } from 'src/utils/helpers/uidGenerator'


export interface PlotDetailsParams {
  name: string,
  length: number,
  width: number,
  radius: number,
  group: null
}




const useMonitoringPlotManagement = () => {
  const realm = useRealm()

  // A plot is read-only once it has been synced: there is no server update path
  // for plot or observation details, so a local edit would silently diverge.
  const isPlotSynced = (id: string): boolean => {
    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
    return plot?.status === 'SYNCED'
  }

  // A plant is read-only once it has a server tree id (it has been uploaded).
  // Only new measurements (remeasurements) may be added to it afterwards.
  const isPlantSynced = (id: string, plantId: string): boolean => {
    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
    const plant = plot?.plot_plants.find(el => el.plot_plant_id === plantId)
    return !!plant?.server_tree_id
  }

  // A single measurement is read-only once it has been pushed to the server.
  const isTimelineSynced = (id: string, plantId: string, timelineId: string): boolean => {
    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
    const plant = plot?.plot_plants.find(el => el.plot_plant_id === plantId)
    const entry = plant?.timeline.find(el => el.timeline_id === timelineId)
    return entry?.sync_status === 'SYNCED'
  }

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
 return false
    }
  }

  const updatePlotDetails = async (
    id: string,
    data: PlotDetailsParams
  ): Promise<boolean> => {
    try {
      if (isPlotSynced(id)) return false
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
 return false
    }
  }

  const updatePlotLocation = async (
    id: string,
    coordinate: Array<number[]>,
    isEdit: boolean,
    dimensions?: {
      h: number,
      w: number,
      r: number
    }
  ): Promise<boolean> => {
    try {
      // A synced plot is already complete; any call here would be an edit.
      if (isEdit && isPlotSynced(id)) return false
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
        plotData.is_complete = true
        plotData.lastScreen = 'location'
        if (isEdit) {
          plotData.length = dimensions.h
          plotData.width = dimensions.w
          plotData.radius = dimensions.r
        }
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
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
 return false
    }
  }

  const deleteImageRecord = async (imageId: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const record = realm.objectForPrimaryKey<{ image_id: string; local_uri: string; cdn_url: string; parent_id: string; type: string }>(RealmSchema.ImageData, imageId)
        if (!record) return

        const parentId = record.parent_id
        const type = record.type
        realm.delete(record)

        // Update plot's local_image after deletion
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, parentId)
        if (plot) {
          const remaining = realm.objects<{ image_id: string; local_uri: string; cdn_url: string }>(RealmSchema.ImageData)
            .filtered('parent_id == $0 AND type == $1', parentId, type)
          const next = remaining.length > 0 ? (remaining[0].local_uri || remaining[0].cdn_url) : ''
          plot.local_image = next
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  const addPlotImageRecord = async (
    plotId: string,
    localUri: string,
    type: string = 'monitoring_plot',
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(RealmSchema.ImageData, {
          image_id: generateUid('img'),
          local_uri: localUri,
          cdn_url: '',
          type,
          parent_id: plotId,
          date_taken: Date.now(),
          lat: 0,
          lon: 0,
          status: 'NOT_SYNCED',
          additional_data: '',
        })
      })
      return true
    } catch (error) {
      return false
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
 return false
    }
  }


  const updatePlotName = async (
    id: string,
    name: string
  ): Promise<boolean> => {
    try {
      if (isPlotSynced(id)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.name = name
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }
  const updatePlotPlantLocation = async (
    id: string,
    plantId: string,
    lat: number,
    long: number
  ): Promise<boolean> => {
    try {
      if (isPlantSynced(id, plantId)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const plantIndex = plotData.plot_plants.findIndex(el => el.plot_plant_id === plantId)
        plotData.plot_plants[plantIndex].latitude = lat
        plotData.plot_plants[plantIndex].longitude = long
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }


  const deleteMonitoringPlot = async (plotID: string): Promise<boolean> => {
    try {
      // A synced plot lives on the server with no mobile delete path, so
      // deleting it locally would only drop it from the device.
      if (isPlotSynced(plotID)) return false
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plot) {
          realm.delete(plot);
        }
      });
      return true    } catch (error) {
 return false;
    }
  };

  const deletePlotGroup = async (gid: string): Promise<boolean> => {
    try {
      const plotList = []
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        groupData.plots.forEach(el => plotList.push(el.plot_id))
        realm.delete(groupData);
      });
      realm.write(() => {
        plotList.forEach(el => {
          const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, el);
          plotData.plot_updated_at = Date.now()
        })
      });
      return true    } catch (error) {
 return false;
    }
  };

  const addNewMeasurementPlantPlots = async (
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
        plotData.plot_plants[index].is_alive = timeLine.status !== 'DECEASED'
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }




  const updateTimelineDetails = async (
    id: string,
    plantId: string,
    timelineId: string,
    details: {
      l: number,
      w: number,
      date: number,
      status: PLOT_PLANT_STATUS,
      image: string,
    }
  ): Promise<boolean> => {
    try {
      if (isTimelineSynced(id, plantId, timelineId)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const index = plotData.plot_plants.findIndex(el => el.plot_plant_id === plantId)
        const timelineDetails = plotData.plot_plants[index].timeline.find(el => el.timeline_id === timelineId)
        timelineDetails.date = details.date
        timelineDetails.length = details.l
        timelineDetails.width = details.w
        timelineDetails.status = details.status
        timelineDetails.image = details.image
        plotData.plot_updated_at = Date.now()
        plotData.plot_plants[index].is_alive = details.status !== 'DECEASED'
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }


  const deletePlotTimeline = async (
    id: string,
    plantId: string,
    timelineId: string,
  ): Promise<boolean> => {
    try {
      if (isTimelineSynced(id, plantId, timelineId)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const index = plotData.plot_plants.findIndex(el => el.plot_plant_id === plantId)
        const timelineDetails = plotData.plot_plants[index].timeline.find(el => el.timeline_id === timelineId)
        plotData.plot_plants[index].timeline = plotData.plot_plants[index].timeline.filter(el => timelineDetails.timeline_id !== el.timeline_id)
        plotData.plot_updated_at = Date.now()
        plotData.plot_plants[index].is_alive = timelineDetails.status === 'DECEASED' ? true : plotData.plot_plants[index].is_alive
        realm.delete(timelineDetails)
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }


  const updatePlotPlatDetails = async (
    id: string,
    plantId: string,
    updatedDetails: {
      tag: string,
      type: any,
      species: {
        guid: string,
        scientificName: string,
        aliases: string,
      }
    }
  ): Promise<boolean> => {
    try {
      if (isPlantSynced(id, plantId)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const index = plotData.plot_plants.findIndex(el => el.plot_plant_id === plantId)
        plotData.plot_plants[index].scientificName = updatedDetails.species.scientificName
        plotData.plot_plants[index].guid = updatedDetails.species.guid
        plotData.plot_plants[index].aliases = updatedDetails.species.aliases
        plotData.plot_plants[index].tag = updatedDetails.tag
        plotData.plot_plants[index].type = updatedDetails.type
        plotData.plot_plants[index].details_updated_at = Date.now()
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }


  const deletePlantDetails = async (id: string, plantId: string): Promise<boolean> => {
    try {
      if (isPlantSynced(id, plantId)) return false
      realm.write(() => {
        const plotDetails = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const plantDetails = plotDetails.plot_plants.find(el => el.plot_plant_id === plantId)
        const filteredData = plotDetails.plot_plants.filter(el => el.plot_plant_id !== plantId)
        plotDetails.plot_plants = filteredData
        realm.delete(plantDetails)
        plotDetails.plot_updated_at = Date.now()
      })
      return true    } catch (error) {
 return false;
    }
  };

  const addPlotObservation = async (
    id: string,
    observationDEtails: PlotObservation
  ): Promise<boolean> => {
    try {
      // Observations only ride up with the initial plot upload; one added to a
      // synced plot has no upload path, so block it instead of stranding it.
      if (isPlotSynced(id)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.observations = [...plotData.observations, { ...observationDEtails }]
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }

  const updatePlotObservation = async (
    id: string,
    observationDEtails: PlotObservation
  ): Promise<boolean> => {
    try {
      if (isPlotSynced(id)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const observation = realm.objectForPrimaryKey<PlotObservation>(RealmSchema.PlotObservation, observationDEtails.obs_id);
        observation.obs_date = observationDEtails.obs_date
        observation.type = observationDEtails.type
        observation.value = observationDEtails.value
        observation.unit = observationDEtails.unit
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }

  const deletePlotObservation = async (
    id: string,
    obsId: string
  ): Promise<boolean> => {
    try {
      if (isPlotSynced(id)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const observation = realm.objectForPrimaryKey<PlotObservation>(RealmSchema.PlotObservation, obsId);
        realm.delete(observation)
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
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
 return false
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
 return false
    }
  }

  const addPlotToGroup = async (
    gid: string,
    plot: MonitoringPlot,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        const cleanData = groupData.plots.filter(el => el.plot_id !== plot.plot_id)
        groupData.plots = [...cleanData, plot];
        groupData.details_updated_at = Date.now()
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plot.plot_id);
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }

  // Mark a plot SYNCED once the server has accepted it. Stores the parent hid
  // and the returned server uid (stashed in meta_data without clobbering
  // existing keys) so a later plot-group sync can reference the uploaded plot.
  // `plants` is the server's clientId -> treeUid map: it records each plant's
  // server tree id (so later remeasurements can target it) and marks every
  // currently-present timeline entry SYNCED (they all went up with this upload).
  const markMonitoringPlotSynced = async (
    plotId: string,
    hid: string,
    serverUid: string,
    plants?: { clientId: string; treeUid: string }[],
  ): Promise<boolean> => {
    try {
      const treeUidByClient = new Map((plants || []).map(p => [p.clientId, p.treeUid]));
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId);
        if (!plot) return;
        plot.status = 'SYNCED';
        if (hid) plot.hid = hid;
        let meta: Record<string, any> = {};
        try { meta = plot.meta_data ? JSON.parse(plot.meta_data) : {}; } catch (_) { meta = {}; }
        if (serverUid) meta.serverUid = serverUid;
        plot.meta_data = JSON.stringify(meta);
        plot.plot_plants.forEach(plant => {
          const treeUid = treeUidByClient.get(plant.plot_plant_id);
          if (treeUid) plant.server_tree_id = treeUid;
          plant.timeline.forEach(t => { t.sync_status = 'SYNCED'; });
        });
        plot.plot_updated_at = Date.now();
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Mark plants added to an already-synced plot as synced: store each plant's
  // server tree id and flip its current timeline entries to SYNCED (they went up
  // with the add-plants call, same as the initial upload).
  const markPlotPlantsSynced = async (
    plotId: string,
    plants: { clientId: string; treeUid: string }[],
  ): Promise<boolean> => {
    try {
      const treeUidByClient = new Map(plants.map(p => [p.clientId, p.treeUid]));
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId);
        if (!plot) return;
        plot.plot_plants.forEach(plant => {
          const treeUid = treeUidByClient.get(plant.plot_plant_id);
          if (!treeUid) return;
          plant.server_tree_id = treeUid;
          plant.timeline.forEach(t => { t.sync_status = 'SYNCED'; });
        });
        plot.plot_updated_at = Date.now();
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Mark the given timeline entries SYNCED after their remeasurement upload was
  // accepted. Scoped per tree (server_tree_id) and per timeline id so only the
  // entries that actually went up are flipped.
  const markRemeasurementsSynced = async (
    plotId: string,
    synced: { treeUid: string; timelineIds: string[] }[],
  ): Promise<boolean> => {
    try {
      const idsByTree = new Map(synced.map(s => [s.treeUid, new Set(s.timelineIds)]));
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId);
        if (!plot) return;
        plot.plot_plants.forEach(plant => {
          const ids = idsByTree.get(plant.server_tree_id);
          if (!ids) return;
          plant.timeline.forEach(t => { if (ids.has(t.timeline_id)) t.sync_status = 'SYNCED'; });
        });
        plot.plot_updated_at = Date.now();
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const removePlotFromGroup = async (
    gid: string,
    plot_id: string,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        groupData.plots = groupData.plots.filter(el => el.plot_id !== plot_id)
        groupData.details_updated_at = Date.now()
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plot_id);
        plotData.plot_updated_at = Date.now()
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }



  return { updatePlotObservation, deletePlotObservation, deletePlotTimeline, updateTimelineDetails, deletePlantDetails: deletePlantDetails, updatePlotPlatDetails, updatePlotName, deletePlotGroup, updatePlotPlantLocation, removePlotFromGroup, addPlotToGroup, editGroupName, createNewPlotGroup, deleteMonitoringPlot, initializeNewPlot, addPlotObservation, updatePlotDetails, updatePlotLocation, updatePlotImage, addPlantDetailsPlot, addNewMeasurementPlantPlots, addPlotImageRecord, deleteImageRecord, markMonitoringPlotSynced, markRemeasurementsSynced, markPlotPlantsSynced }
}

export default useMonitoringPlotManagement



