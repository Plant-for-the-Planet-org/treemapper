import { useRealm, Realm } from '@realm/react'
import NetInfo from '@react-native-community/netinfo'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies, PlotGroups, PlotObservation } from 'src/types/interface/slice.interface'
import { FIX_REQUIRED, PLOT_PLANT_STATUS } from 'src/types/type/app.type'
import { generateUid } from 'src/utils/helpers/uidGenerator'
import { polygonCenter } from 'src/utils/helpers/turfHelpers'
import {
  createPlotGroupOnServer,
  updatePlotGroupOnServer,
  deletePlotGroupOnServer,
  fetchProjectPlots,
} from 'src/api/api.fetch'
import {
  ServerPlot,
  toImageRecord,
  toMonitoringPlot,
  toObservation,
  toPlant,
} from 'src/utils/helpers/monitoringPlotHelper/plotPullHelper'
import { ProjectInterface } from 'src/types/interface/app.interface'


export interface PlotDetailsParams {
  name: string,
  length: number,
  width: number,
  radius: number,
  group: null
}

/**
 * Outcome of a plot-group action.
 *
 * Groups are organisation, not field capture: unlike a plot there is nothing to
 * record offline under a tree, so creating, renaming and deleting one all go to
 * the server in the moment and fail loudly when there is no connection. That
 * keeps the device and the dashboard showing the same groups instead of two
 * lists that quietly disagree.
 *
 *  - `offline`  no connection, nothing changed anywhere
 *  - `server`   the server refused or could not be reached
 *  - `local`    the server accepted it but the Realm write failed
 */
export type PlotGroupResult = {
  ok: boolean
  reason?: 'offline' | 'server' | 'local'
}

/** What a manual refresh did, so the screen can say something specific. */
export type PlotRefreshResult = {
  ok: boolean
  added: number
  updated: number
  removed: number
  /** `offline` nothing was tried; `partial` some projects failed. */
  reason?: 'offline' | 'partial' | 'server'
}

const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch()
    return state.isConnected !== false
  } catch (_) {
    // NetInfo itself failing should not block the user; let the request decide.
    return true
  }
}

/** The server uid a plot was given when it uploaded, if it has been uploaded. */
const serverUidOf = (plot: MonitoringPlot | undefined | null): string => {
  if (!plot || plot.status !== 'SYNCED') return ''
  try {
    const meta = plot.meta_data ? JSON.parse(plot.meta_data) : {}
    return typeof meta?.serverUid === 'string' ? meta.serverUid : ''
  } catch (_) {
    return ''
  }
}




const useMonitoringPlotManagement = () => {
  const realm = useRealm()

  // A plot is read-only once it has been synced: there is no server update path
  // for plot or observation details, so a local edit would silently diverge.
  const isPlotSynced = (id: string): boolean => {
    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
    return plot?.status === 'SYNCED'
  }

  // Clear a plot's quarantine. A plot the server refused leaves the sync queue
  // until the user changes something about it, so every local content edit calls
  // this: the data is different now, and the next sync deserves a fresh attempt.
  // Must be called inside a realm.write.
  const clearFixRequired = (plot: MonitoringPlot | null | undefined) => {
    if (plot && plot.fix_required !== 'NO') plot.fix_required = 'NO'
  }

  // Take a plot out of the sync queue because retrying the same payload can
  // never work: the server read it and refused (SERVER_REJECTED), or the payload
  // could not be built at all (UNKNOWN). It shows as "Fix required" in the plot
  // list until an edit clears it.
  const updateFixRequiredPlot = async (
    plotId: string,
    reason: FIX_REQUIRED,
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
        if (!plot) return
        plot.fix_required = reason
      })
      return true
    } catch (error) {
      return false
    }
  }

  // A plant is read-only once it has a server tree id (it has been uploaded).
  // Only new measurements (remeasurements) may be added to it afterwards.
  const isPlantSynced = (id: string, plantId: string): boolean => {
    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
    const plant = plot?.plot_plants.find(el => el.plot_plant_id === plantId)
    return !!plant?.server_tree_id
  }

  // A single observation is read-only once it has been pushed to the server.
  // New observations may still be added to a synced plot (they upload through the
  // add-observations endpoint), but an already-uploaded one cannot be edited.
  const isObservationSynced = (id: string, obsId: string): boolean => {
    const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
    const obs = plot?.observations.find(el => el.obs_id === obsId)
    return obs?.sync_status === 'SYNCED'
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
        clearFixRequired(plotData)
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }

  // `coordinate` is GeoJSON Polygon coordinates: an array of rings, despite what
  // the parameter type says. The declared type is left alone because every caller
  // passes it this way and tightening it here would only move the lie.
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
        // The plot's centre. This used to read coordinate[0][0][0], a single
        // number where a [lng, lat] pair belongs, so buildCoords rejected it on
        // every sync and no plot recorded on a device ever had a centre stored.
        const centre = polygonCenter(coordinate as unknown as number[][][])
        plotData.coords = {
          type: 'Point',
          coordinates: centre ?? []
        }
        plotData.is_complete = true
        plotData.lastScreen = 'location'
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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

  // Delete on the server first, then locally, so the two never disagree about
  // which groups exist. The server unassigns every plot that was in the group;
  // on the device the same thing happens for free, because a plot's group link is
  // a backlink to the group object we are deleting. The plots themselves are
  // untouched on both sides.
  const deletePlotGroup = async (gid: string): Promise<PlotGroupResult> => {
    const group = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid)
    if (!group) return { ok: false, reason: 'local' }
    // A pre-v29 group only ever existed here, so there is nothing to delete
    // remotely and no reason to demand a connection for it.
    if (group.sync_status !== 'LOCAL_ONLY') {
      if (!(await isOnline())) return { ok: false, reason: 'offline' }
      try {
        const { success, status } = await deletePlotGroupOnServer(group.project_id, gid)
        // A group already gone from the server (404) is the state we wanted, so
        // treat it as done and clear the local copy rather than stranding it.
        if (!success && status !== 404) return { ok: false, reason: 'server' }
      } catch (_) {
        return { ok: false, reason: 'server' }
      }
    }
    try {
      const plotList: string[] = []
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        if (!groupData) return
        groupData.plots.forEach(el => plotList.push(el.plot_id))
        realm.delete(groupData);
      });
      realm.write(() => {
        plotList.forEach(el => {
          const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, el);
          if (plotData) plotData.plot_updated_at = Date.now()
        })
      });
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: 'local' };
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotData)
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
        clearFixRequired(plotDetails)
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
      // A new observation is always uploadable: it rides up with the initial plot
      // upload, or (on an already-synced plot) through the add-observations
      // endpoint. It starts NOT_SYNCED so the next sync pass picks it up.
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        plotData.observations = [...plotData.observations, { ...observationDEtails, sync_status: 'NOT_SYNCED' }]
        plotData.plot_updated_at = Date.now()
        clearFixRequired(plotData)
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
      // Only an already-uploaded observation is locked; a pending one can be edited.
      if (isObservationSynced(id, observationDEtails.obs_id)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const observation = realm.objectForPrimaryKey<PlotObservation>(RealmSchema.PlotObservation, observationDEtails.obs_id);
        observation.obs_date = observationDEtails.obs_date
        observation.type = observationDEtails.type
        observation.value = observationDEtails.value
        observation.unit = observationDEtails.unit
        plotData.plot_updated_at = Date.now()
        clearFixRequired(plotData)
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
      // A synced observation lives on the server with no mobile delete path.
      if (isObservationSynced(id, obsId)) return false
      realm.write(() => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id);
        const observation = realm.objectForPrimaryKey<PlotObservation>(RealmSchema.PlotObservation, obsId);
        realm.delete(observation)
        plotData.plot_updated_at = Date.now()
        clearFixRequired(plotData)
      })
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }


  // Every uploaded plot in a group, as the server uids the group routes expect.
  // Plots that have not synced yet are simply absent: they carry their group with
  // them when they upload (CreateMonitoringPlotDto.plotGroupUid), so they join
  // the group server-side at that moment instead of needing a second call.
  const syncedPlotUids = (gid: string): string[] => {
    const group = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid)
    if (!group) return []
    return [...group.plots].map(p => serverUidOf(p)).filter(uid => !!uid)
  }

  // Membership changed while offline. The group still exists on the server, it
  // just holds a stale member list, so flag it and let the next online visit to
  // the groups screen push the whole set (updateGroup reconciles, so one call
  // fixes any amount of drift).
  const markGroupMembersDirty = (gid: string) => {
    const group = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid)
    if (!group || group.sync_status === 'LOCAL_ONLY') return
    group.sync_status = 'NOT_SYNCED'
  }

  // Create the group on the server first, then locally. Server first because a
  // group the dashboard has never heard of is exactly the bug this replaces: if
  // the request fails, nothing is written and the user is told why.
  const createNewPlotGroup = async (
    groupDetails: PlotGroups,
  ): Promise<PlotGroupResult> => {
    if (!groupDetails.project_id) return { ok: false, reason: 'server' }
    if (!(await isOnline())) return { ok: false, reason: 'offline' }
    try {
      const { success } = await createPlotGroupOnServer(groupDetails.project_id, {
        // The server keys idempotency on clientId and stores it as the group's
        // own uid, so the device and the server share one id for this group.
        clientId: groupDetails.group_id,
        name: groupDetails.name,
        plotUids: [],
      })
      if (!success) return { ok: false, reason: 'server' }
    } catch (_) {
      return { ok: false, reason: 'server' }
    }
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.PlotGroups,
          { ...groupDetails, sync_status: 'SYNCED' },
          Realm.UpdateMode.All,
        )
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: 'local' }
    }
  }

  // Rename on the server, then locally, for the same reason as create.
  const editGroupName = async (
    id: string,
    name: string,
  ): Promise<PlotGroupResult> => {
    const group = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, id)
    if (!group) return { ok: false, reason: 'local' }
    if (group.name === name) return { ok: true }
    // A pre-v29 group was never uploaded and has no server row to rename.
    if (group.sync_status !== 'LOCAL_ONLY') {
      if (!(await isOnline())) return { ok: false, reason: 'offline' }
      try {
        const { success } = await updatePlotGroupOnServer(group.project_id, id, { name })
        if (!success) return { ok: false, reason: 'server' }
      } catch (_) {
        return { ok: false, reason: 'server' }
      }
    }
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, id);
        groupData.name = name
        groupData.details_updated_at = Date.now()
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: 'local' }
    }
  }

  // Assignment is allowed offline: a plot is captured in the field and grouping
  // it there should not need a signal. The local write always lands; the server
  // is brought in step immediately when there is a connection, and otherwise on
  // the next online visit to the groups screen.
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
        markGroupMembersDirty(gid)
      })
      await pushGroupMembers(gid)
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }

  // Push the group's full member list to the server and clear the dirty flag.
  // Safe to call at any time: updateGroup reconciles to exactly what is sent, so
  // a repeat is a no-op rather than a duplicate.
  const pushGroupMembers = async (gid: string): Promise<boolean> => {
    const group = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid)
    if (!group || group.sync_status === 'LOCAL_ONLY' || !group.project_id) return false
    if (!(await isOnline())) return false
    try {
      const { success } = await updatePlotGroupOnServer(group.project_id, gid, {
        plotUids: syncedPlotUids(gid),
      })
      if (!success) return false
    } catch (_) {
      return false
    }
    try {
      realm.write(() => {
        const groupData = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, gid);
        if (groupData) groupData.sync_status = 'SYNCED'
      })
      return true
    } catch (_) {
      return false
    }
  }

  /**
   * Pull the server's plots for one project and reconcile the local copy.
   *
   * Three rules, and they are the whole design:
   *
   *  1. Local work is never destroyed. A plot that has not synced yet is
   *     untouched, and so are the plants, observations and photos a user added
   *     to a synced plot but has not pushed. The server does not know about any
   *     of it, so it cannot have an opinion.
   *  2. Anything already synced is replaced by what the server holds. The
   *     server is the record for that data, and a device copy that disagrees is
   *     stale, not a second opinion.
   *  3. A synced plot the server no longer lists was deleted there, so it goes
   *     here too. This is what stops a field team standing in a plot that does
   *     not exist and remeasuring it.
   *
   * Runs inside one realm.write, so a refresh either lands whole or not at all.
   */
  const applyServerPlots = (
    project: { id: string; name: string },
    serverPlots: ServerPlot[],
  ): { added: number; updated: number; removed: number } => {
    let added = 0
    let updated = 0
    let removed = 0

    realm.write(() => {
      const localPlots = realm
        .objects<MonitoringPlot>(RealmSchema.MonitoringPlot)
        .filtered('project_id == $0', project.id)

      // Two ways in: the device's own id for plots it uploaded, and the stored
      // server uid for everything else (including plots made on the dashboard).
      const byLocalId = new Map<string, MonitoringPlot>()
      const byServerUid = new Map<string, MonitoringPlot>()
      for (const plot of localPlots) {
        byLocalId.set(plot.plot_id, plot)
        const uid = serverUidOf(plot)
        if (uid) byServerUid.set(uid, plot)
      }

      const matched = new Set<string>()

      for (const serverPlot of serverPlots) {
        if (!serverPlot?.uid) continue
        const existing =
          (serverPlot.clientId ? byLocalId.get(serverPlot.clientId) : undefined)
          ?? byServerUid.get(serverPlot.uid)

        if (!existing) {
          // A plot this device has never seen: one made on the dashboard, or one
          // uploaded from another phone. Its local id is the server uid, since
          // there is no device id to keep.
          realm.create(
            RealmSchema.MonitoringPlot,
            toMonitoringPlot(serverPlot, serverPlot.uid, project),
            Realm.UpdateMode.All,
          )
          writePlotPhotos(serverPlot, serverPlot.uid)
          added += 1
          continue
        }

        matched.add(existing.plot_id)

        // A plot that has not finished uploading is mid-flight local work. Rule 1.
        if (existing.status !== 'SYNCED') continue

        mergeServerPlot(existing, serverPlot, project)
        writePlotPhotos(serverPlot, existing.plot_id)
        updated += 1
      }

      // Rule 3. Snapshot the ids first: deleting from a live results set while
      // iterating it skips rows.
      const strandedIds = [...localPlots]
        .filter(plot => plot.status === 'SYNCED' && !matched.has(plot.plot_id))
        .map(plot => plot.plot_id)

      for (const plotId of strandedIds) {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
        if (!plot) continue
        const photos = realm
          .objects(RealmSchema.ImageData)
          .filtered('parent_id == $0', plotId)
        realm.delete(photos)
        realm.delete(plot)
        removed += 1
      }
    })

    return { added, updated, removed }
  }

  /** Fold one server plot into the local copy, keeping anything not yet pushed. */
  const mergeServerPlot = (
    plot: MonitoringPlot,
    serverPlot: ServerPlot,
    project: { id: string; name: string },
  ) => {
    const fresh = toMonitoringPlot(serverPlot, plot.plot_id, project)

    plot.name = fresh.name
    plot.shape = fresh.shape
    plot.type = fresh.type
    plot.complexity = fresh.complexity
    plot.radius = fresh.radius
    plot.length = fresh.length
    plot.width = fresh.width
    plot.location = fresh.location
    plot.coords = fresh.coords
    plot.is_complete = fresh.is_complete
    plot.meta_data = fresh.meta_data
    plot.hid = fresh.hid
    plot.cdn_image = fresh.cdn_image
    plot.lastScreen = 'location'
    plot.plot_updated_at = fresh.plot_updated_at

    // Plants and observations the device has not pushed yet are kept as they
    // are; everything else comes from the server.
    const pendingPlants = [...plot.plot_plants].filter(p => !p.server_tree_id)
    plot.plot_plants = [...(serverPlot.plants ?? []).map(toPlant), ...pendingPlants]

    const pendingObservations = [...plot.observations].filter(o => o.sync_status !== 'SYNCED')
    plot.observations = [
      ...(serverPlot.observations ?? []).map(toObservation),
      ...pendingObservations,
    ]
  }

  /**
   * Store the plot's photos and its plants' photos as local gallery rows.
   *
   * Photos still waiting to upload are left alone: they have no server row, so
   * the response cannot mention them, and dropping them would lose the file.
   */
  const writePlotPhotos = (serverPlot: ServerPlot, localPlotId: string) => {
    const rows = [
      ...(serverPlot.images ?? []).map(img => toImageRecord(img, localPlotId, 'monitoring_plot')),
      ...(serverPlot.plants ?? []).flatMap(plant =>
        (plant.images ?? []).map(img => toImageRecord(img, plant.uid, 'monitoring_plant')),
      ),
    ]
    for (const row of rows) {
      realm.create(RealmSchema.ImageData, row, Realm.UpdateMode.Modified)
    }
  }

  /**
   * Refresh every project's plots from the server. Manual only: this is the
   * whole set for each project, so it is the wrong thing to run on a timer.
   */
  const refreshPlotsFromServer = async (): Promise<PlotRefreshResult> => {
    const empty = { added: 0, updated: 0, removed: 0 }
    if (!(await isOnline())) return { ok: false, ...empty, reason: 'offline' }

    const projects = [...realm.objects<ProjectInterface>(RealmSchema.Projects)]
      .filter(p => !!p.id)
      .map(p => ({ id: p.id, name: p.name || '' }))
    if (projects.length === 0) return { ok: true, ...empty }

    let added = 0
    let updated = 0
    let removed = 0
    let failed = 0

    for (const project of projects) {
      try {
        const { response, success } = await fetchProjectPlots(project.id)
        const serverPlots = response?.data?.plots
        if (!success || !Array.isArray(serverPlots)) {
          failed += 1
          continue
        }
        const counts = applyServerPlots(project, serverPlots)
        added += counts.added
        updated += counts.updated
        removed += counts.removed
      } catch (_) {
        failed += 1
      }
    }

    if (failed === projects.length) {
      return { ok: false, added, updated, removed, reason: 'server' }
    }
    return {
      ok: true,
      added,
      updated,
      removed,
      ...(failed > 0 ? { reason: 'partial' as const } : {}),
    }
  }

  // Bring every group whose members drifted offline back in step. Called when the
  // groups screen opens, so the reconcile costs nothing when nothing has drifted.
  const reconcilePlotGroups = async (): Promise<void> => {
    const dirty = realm
      .objects<PlotGroups>(RealmSchema.PlotGroups)
      .filtered('sync_status == "NOT_SYNCED"')
      .map(g => g.group_id)
    for (const gid of dirty) {
      await pushGroupMembers(gid)
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
        // Observations all go up with this initial upload, so mark them SYNCED.
        plot.observations.forEach(o => { o.sync_status = 'SYNCED'; });
        plot.plot_updated_at = Date.now();
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Mark plot photos synced once the server holds them. The stored filename is
  // kept as the row's cdn_url, so the gallery can read the remote copy and a
  // later sync does not upload the same photo again.
  const markPlotImagesSynced = async (
    uploaded: { imageId: string; filename: string }[],
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        uploaded.forEach(({ imageId, filename }) => {
          if (!imageId) return
          const record = realm.objectForPrimaryKey<{ cdn_url: string; status: string }>(RealmSchema.ImageData, imageId)
          if (!record) return
          if (filename) record.cdn_url = filename
          record.status = 'SYNCED'
        })
      })
      return true
    } catch (error) {
      return false
    }
  }

  // Mark observations added to an already-synced plot as synced after the
  // add-observations upload was accepted. Scoped to the obs ids the server
  // actually stored, so only those that went up are flipped.
  const markPlotObservationsSynced = async (
    plotId: string,
    syncedObsIds: string[],
  ): Promise<boolean> => {
    try {
      const ids = new Set(syncedObsIds);
      realm.write(() => {
        const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId);
        if (!plot) return;
        plot.observations.forEach(o => { if (ids.has(o.obs_id)) o.sync_status = 'SYNCED'; });
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
        markGroupMembersDirty(gid)
      })
      await pushGroupMembers(gid)
      return Promise.resolve(true)
    } catch (error) {
 return false
    }
  }



  return { updatePlotObservation, deletePlotObservation, deletePlotTimeline, updateTimelineDetails, deletePlantDetails: deletePlantDetails, updatePlotPlatDetails, updatePlotName, deletePlotGroup, updatePlotPlantLocation, removePlotFromGroup, addPlotToGroup, editGroupName, createNewPlotGroup, deleteMonitoringPlot, initializeNewPlot, addPlotObservation, updatePlotDetails, updatePlotLocation, updatePlotImage, addPlantDetailsPlot, addNewMeasurementPlantPlots, addPlotImageRecord, deleteImageRecord, markMonitoringPlotSynced, markRemeasurementsSynced, markPlotPlantsSynced, markPlotObservationsSynced, markPlotImagesSynced, reconcilePlotGroups, pushGroupMembers, updateFixRequiredPlot, refreshPlotsFromServer }
}

export default useMonitoringPlotManagement



