import {
  MonitoringPlot,
  PlantTimeLine,
  PlantedPlotSpecies,
  PlotObservation,
} from 'src/types/interface/slice.interface'
import { PLOT_COMPLEXITY, PLOT_SHAPE, PLOT_TYPE } from 'src/types/type/app.type'

/**
 * Turning the server's plots back into Realm objects.
 *
 * Everything here is pure: it takes the sync response and returns plain objects
 * for the caller to write. The Realm side lives in useMonitoringPlotManagement,
 * so this file can be reasoned about without a database.
 *
 * The device and the server disagree on vocabulary in a few places, because the
 * device's words came first and the server normalised them. Each mapping below
 * says which way it goes.
 */

/** Server plot shape -> the device's word for it. Inverse of SHAPE_MAP. */
const SHAPE_FROM_SERVER: Record<string, PLOT_SHAPE> = {
  circle: 'CIRCULAR',
  rectangle: 'RECTANGULAR',
}

/** Server sends lower case; the device stores upper. */
const upper = (value?: string | null): string => (value ? String(value).toUpperCase() : '')

/** ISO string (or Date) -> epoch millis, which is what Realm stores. */
const toMillis = (value?: string | null): number => {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

const num = (value: unknown): number => (typeof value === 'number' ? value : 0)

export interface ServerPlotImage {
  uid: string
  filename: string
  type?: string | null
  isPrimary?: boolean | null
  createdAt?: string | null
}

export interface ServerPlotTimelineEntry {
  uid: string
  recordType?: string | null
  recordedAt?: string | null
  height?: number | null
  width?: number | null
  newStatus?: string | null
  image?: string | null
}

export interface ServerPlotPlant {
  uid: string
  hid: string
  tag?: string | null
  speciesName?: string | null
  commonName?: string | null
  scientificSpeciesUid?: string | null
  status?: string | null
  latitude?: number | null
  longitude?: number | null
  height?: number | null
  width?: number | null
  plantingDate?: string | null
  lastMeasurementDate?: string | null
  image?: string | null
  timeline?: ServerPlotTimelineEntry[]
  images?: ServerPlotImage[]
}

export interface ServerPlotObservation {
  uid: string
  type: string
  observedAt?: string | null
  unit?: string | null
  value?: number | null
}

export interface ServerPlot {
  uid: string
  hid: string
  /** The device's own id for a plot it uploaded. Absent for dashboard-made plots. */
  clientId?: string | null
  name?: string | null
  shape?: string | null
  plotType?: string | null
  complexity?: string | null
  radius?: number | null
  length?: number | null
  width?: number | null
  geometry?: any
  center?: { type: string; coordinates: number[] } | null
  isComplete?: boolean | null
  metadata?: Record<string, unknown> | null
  image?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  site?: { uid: string; name: string } | null
  group?: { uid: string; name: string } | null
  plants?: ServerPlotPlant[]
  observations?: ServerPlotObservation[]
  images?: ServerPlotImage[]
}

/**
 * The device's timeline word for one server measurement record.
 *
 * The device names the event (PLANTED on the first entry, REMEASUREMENT on every
 * later visit, DECEASED when the tree is found dead); the server stores the
 * record type and the health status it changed to. The original word cannot be
 * recovered exactly, so this reconstructs the one that reads the same.
 */
const timelineStatus = (entry: ServerPlotTimelineEntry): string => {
  if (entry.recordType === 'planting') return 'PLANTED'
  if ((entry.newStatus || '').toLowerCase() === 'dead') return 'DECEASED'
  return 'REMEASUREMENT'
}

const toTimeline = (entries: ServerPlotTimelineEntry[] = []): PlantTimeLine[] =>
  entries.map(entry => ({
    // The server uid is the id here. It is stable and unique, and a pulled entry
    // is already on the server, so nothing will try to upload it again.
    timeline_id: entry.uid,
    status: timelineStatus(entry),
    length: num(entry.height),
    width: num(entry.width),
    date: toMillis(entry.recordedAt),
    length_unit: 'm',
    width_unit: 'cm',
    image: entry.image || '',
    sync_status: 'SYNCED',
  })) as PlantTimeLine[]

export const toPlant = (plant: ServerPlotPlant): PlantedPlotSpecies => ({
  // A pulled plant is identified by its server tree uid. The device only mints
  // its own ids for plants it creates.
  plot_plant_id: plant.uid,
  tag: plant.tag || '',
  guid: plant.scientificSpeciesUid || '',
  scientificName: plant.speciesName || '',
  aliases: plant.commonName || '',
  count: 1,
  image: plant.image || '',
  timeline: toTimeline(plant.timeline),
  planting_date: toMillis(plant.plantingDate),
  is_alive: (plant.status || '').toLowerCase() !== 'dead',
  type: 'PLANTED',
  details_updated_at: toMillis(plant.lastMeasurementDate) || toMillis(plant.plantingDate),
  // Null Island is how an unmarked position reads on this device, and the server
  // leaves the position out entirely when it was never marked.
  latitude: num(plant.latitude),
  longitude: num(plant.longitude),
  // Present on the server, so remeasurements target it directly.
  server_tree_id: plant.uid,
}) as PlantedPlotSpecies

export const toObservation = (observation: ServerPlotObservation): PlotObservation => ({
  obs_id: observation.uid,
  type: observation.type || '',
  obs_date: toMillis(observation.observedAt),
  unit: observation.unit || '',
  value: num(observation.value),
  sync_status: 'SYNCED',
}) as PlotObservation

/** The boundary, stored the way the device stores it: rings as a JSON string. */
const toLocation = (geometry: any): { type: string; coordinates: string } => {
  const rings = geometry?.type === 'Feature' ? geometry.geometry?.coordinates : geometry?.coordinates
  return {
    type: 'Polygon',
    coordinates: JSON.stringify(Array.isArray(rings) ? rings : []),
  }
}

/**
 * One server plot as a local Realm plot.
 *
 * `localId` is the id the plot should keep: its own for a plot this device
 * uploaded, the server uid for one made on the dashboard. `meta_data` carries
 * the server uid, which is what every later push targets, so it is written even
 * for a plot the device has never seen.
 */
export const toMonitoringPlot = (
  plot: ServerPlot,
  localId: string,
  project: { id: string; name: string },
): MonitoringPlot => ({
  plot_id: localId,
  complexity: (upper(plot.complexity) || 'STANDARD') as PLOT_COMPLEXITY,
  shape: (SHAPE_FROM_SERVER[plot.shape || ''] || 'CIRCULAR') as PLOT_SHAPE,
  type: (upper(plot.plotType) || 'INTERVENTION') as PLOT_TYPE,
  radius: num(plot.radius),
  length: num(plot.length),
  width: num(plot.width),
  name: plot.name || '',
  project_id: project.id,
  project_name: project.name,
  location: toLocation(plot.geometry),
  coords: {
    type: 'Point',
    coordinates: Array.isArray(plot.center?.coordinates) ? plot.center!.coordinates : [],
  },
  plot_plants: (plot.plants ?? []).map(toPlant),
  is_complete: plot.isComplete ?? true,
  additional_data: '',
  meta_data: JSON.stringify({ ...(plot.metadata ?? {}), serverUid: plot.uid }),
  status: 'SYNCED',
  fix_required: 'NO',
  fix_reason: '',
  hid: plot.hid || '',
  // A pulled plot is finished; the capture wizard must not reopen at step one.
  lastScreen: 'location',
  plot_created_at: toMillis(plot.createdAt),
  plot_updated_at: toMillis(plot.updatedAt),
  local_image: '',
  cdn_image: plot.image || '',
  observations: (plot.observations ?? []).map(toObservation),
  plot_group: [],
}) as unknown as MonitoringPlot

/** One stored photo as an ImageData row the gallery can read straight away. */
export const toImageRecord = (
  img: ServerPlotImage,
  parentId: string,
  type: 'monitoring_plot' | 'monitoring_plant',
) => ({
  image_id: img.uid,
  local_uri: '',
  // Already on the server, so the gallery reads the remote copy and no sync
  // will try to upload it again.
  cdn_url: img.filename,
  type,
  parent_id: parentId,
  date_taken: toMillis(img.createdAt),
  lat: 0,
  lon: 0,
  status: 'SYNCED',
  additional_data: '',
})
