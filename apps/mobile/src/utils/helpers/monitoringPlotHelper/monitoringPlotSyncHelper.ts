import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { presingedUrl } from 'src/api/api.fetch'
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper'

// Mobile -> server plot shape. The device only records circular/rectangular;
// 'polygon' exists on the server for completeness but is never produced here.
const SHAPE_MAP: Record<string, 'circle' | 'rectangle' | 'polygon'> = {
  CIRCULAR: 'circle',
  RECTANGULAR: 'rectangle',
}

// Server DTO expects ISO date strings. Realm stores epoch millis (double).
const toISO = (ms?: number): string | undefined => {
  if (!ms || Number.isNaN(ms)) return undefined
  try { return new Date(ms).toISOString() } catch { return undefined }
}

// meta_data / additional_data are free-form JSON strings on the device.
const safeParseObject = (raw?: string): Record<string, any> | undefined => {
  if (!raw) return undefined
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : undefined
  } catch { return undefined }
}

// The server only accepts these (R2Service.ALLOWED_IMAGE_MIME_TYPES), and the
// camera writes jpeg. Anything unrecognised is sent as jpeg rather than rejected.
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const fileNameOf = (uri: string): string => uri.split('?')[0].split('/').pop() || 'image.jpg'

const mimeTypeOf = (uri: string): string => {
  const ext = fileNameOf(uri).split('.').pop()?.toLowerCase() || ''
  return MIME_BY_EXTENSION[ext] || 'image/jpeg'
}

/**
 * Upload one local image to S3/R2 via a presigned URL and return the stored
 * filename (the value the server persists as the image reference). A file that
 * is already a remote url is returned unchanged so re-syncs don't re-upload.
 * Returns undefined on any failure: images are optional, so a failed image
 * upload must never block the plot from syncing.
 *
 * The stored path is run through updateFilePath first, the same as the
 * intervention sync does (SyncIntervention.handleTreeImage). Without it the file
 * is unreadable after an app update on iOS, where the container id in the saved
 * path changes, and nothing would ever upload.
 */
export const uploadPlotImage = async (uri?: string): Promise<string | undefined> => {
  if (!uri) return undefined
  if (/^https?:\/\//i.test(uri)) return uri
  try {
    const filePath = updateFilePath(uri)
    const mimeType = mimeTypeOf(filePath)
    const presigned = await presingedUrl({
      // The extension decides the stored key's extension, so send the real name.
      fileName: fileNameOf(filePath),
      fileType: mimeType,
      folder: 'tree',
    })
    if (presigned.success && presigned.response?.code === 'success') {
      const signedUrl = presigned.response.data.data.uploadUrl
      const fileName = presigned.response.data.data.fileName
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: { uri: filePath, type: mimeType, name: fileName || 'image.jpg' } as any,
        headers: { 'Content-Type': mimeType },
      })
      if (uploadResponse.ok) return fileName
    }
  } catch (_) {
    // swallow: image is optional, the plot still uploads without it
  }
  return undefined
}

/**
 * One row of the device image gallery (Realm ImageData). Plot photos live in
 * their own collection rather than on the plot, so they have to be handed to the
 * convertors separately.
 */
export interface PlotImageRecord {
  image_id: string
  local_uri: string
  cdn_url: string
  date_taken: number
  status: string
}

/** What the server stores for one photo (server PlotImageDto). */
interface PlotImagePayload {
  clientId: string
  filename: string
  mimeType: string
  capturedAt?: string
  isPrimary?: boolean
}

/** Which gallery rows made it up, so the caller can stop resending them. */
export interface UploadedPlotImage {
  imageId: string
  filename: string
}

/**
 * Upload a plot's photos one by one and build the payload for the ones that
 * landed. Sequential on purpose: a field connection copes better with one upload
 * at a time, and a photo that fails is simply left for the next sync.
 */
const uploadPlotGallery = async (
  records: PlotImageRecord[],
  coverUri?: string,
): Promise<{ images: PlotImagePayload[]; uploaded: UploadedPlotImage[] }> => {
  const images: PlotImagePayload[] = []
  const uploaded: UploadedPlotImage[] = []
  const coverName = coverUri ? fileNameOf(coverUri) : ''

  for (const record of records) {
    const source = record.cdn_url || record.local_uri
    if (!source) continue
    const filename = await uploadPlotImage(source)
    if (!filename) continue
    images.push({
      clientId: record.image_id,
      filename,
      mimeType: mimeTypeOf(source),
      capturedAt: toISO(record.date_taken),
      // The plot's cover photo, so plot cards on the dashboard show the same one
      // the device shows.
      isPrimary: !!coverName && fileNameOf(record.local_uri) === coverName,
    })
    uploaded.push({ imageId: record.image_id, filename })
  }
  return { images, uploaded }
}

// Plot boundary is stored as { type:'Polygon', coordinates: JSON.stringify(coords) }.
// The device already stores the full GeoJSON Polygon coordinates (an array of
// rings, e.g. [[[lng,lat], ...]]), so it must NOT be wrapped again. We detect the
// nesting depth defensively: depth-3 (array of rings) is used as-is, depth-2 (a
// bare ring) is wrapped once. Returns null when unparseable so the caller can flag
// the plot instead of sending a body the server rejects.
const buildGeometry = (location?: { type: string; coordinates: string }): any => {
  if (!location?.coordinates) return null
  let parsed: any
  try { parsed = JSON.parse(location.coordinates) } catch { return null }
  if (!Array.isArray(parsed) || parsed.length === 0) return null
  if (location.type === 'Point') {
    const pt = Array.isArray(parsed[0]) ? parsed[0] : parsed
    if (!Array.isArray(pt) || pt.length < 2) return null
    return { type: 'Point', coordinates: [pt[0], pt[1]] }
  }
  // Array of rings already (parsed[0][0] is a [lng,lat] pair) -> use as-is.
  // Bare ring (parsed[0] is a [lng,lat] pair) -> wrap once into a single ring.
  const isArrayOfRings = Array.isArray(parsed[0]) && Array.isArray(parsed[0][0])
  const rings = isArrayOfRings ? parsed : [parsed]
  return { type: 'Polygon', coordinates: rings }
}

// Center point (optional). The device's coords ring is sometimes incomplete,
// so only emit a valid [lng, lat] Point and otherwise omit it entirely.
const buildCoords = (coords?: { type: string; coordinates: number[] }): any => {
  const c = coords?.coordinates
  if (!Array.isArray(c) || c.length < 2) return undefined
  if (typeof c[0] !== 'number' || typeof c[1] !== 'number') return undefined
  return { type: 'Point', coordinates: [c[0], c[1]] }
}

// Convert one Realm plot plant into the server plant shape, uploading the plant
// image and every timeline image on the way. Shared by the initial plot upload
// and the add-plants flow so both serialize plants identically.
const convertPlotPlant = async (p: any): Promise<any> => {
  const plantImage = await uploadPlotImage(p.image)
  const timeline: any[] = []
  for (const t of p.timeline || []) {
    const timelineImage = await uploadPlotImage(t.image)
    timeline.push({
      clientId: t.timeline_id || undefined,
      status: t.status ? String(t.status).toLowerCase() : undefined,
      length: typeof t.length === 'number' ? t.length : undefined,
      width: typeof t.width === 'number' ? t.width : undefined,
      date: toISO(t.date),
      lengthUnit: t.length_unit || undefined,
      widthUnit: t.width_unit || undefined,
      image: timelineImage,
    })
  }
  return {
    clientId: p.plot_plant_id || undefined,
    tag: p.tag || undefined,
    scientificSpecies: p.guid || undefined,
    speciesName: p.scientificName || undefined,
    aliases: p.aliases || undefined,
    count: typeof p.count === 'number' && p.count > 0 ? p.count : 1,
    image: plantImage,
    plantingDate: toISO(p.planting_date),
    isAlive: p.is_alive,
    type: p.type ? String(p.type).toLowerCase() : undefined,
    latitude: typeof p.latitude === 'number' ? p.latitude : 0,
    longitude: typeof p.longitude === 'number' ? p.longitude : 0,
    timeline: timeline.length ? timeline : undefined,
  }
}

export interface PlotUploadConversion {
  body: any | null
  // Set when the plot cannot produce a valid payload (e.g. no boundary). Such a
  // plot will never sync as-is, so the caller should surface it rather than
  // retry forever.
  error: string | null
  // Gallery rows that reached storage, so the caller can mark them synced.
  uploadedImages: UploadedPlotImage[]
}

/**
 * Convert a Realm MonitoringPlot into the server upload payload, uploading every
 * referenced image (each plot photo, each plant, each timeline measurement) on
 * the way and replacing the local uri with the stored filename. Pass a plain JS
 * snapshot of the plot (JSON.parse(JSON.stringify(plot))) so live-Realm access
 * doesn't break across the awaited image uploads.
 *
 * `gallery` is the plot's ImageData rows. They live in their own Realm collection
 * with no link to the plot, so the caller has to read and pass them.
 */
export const convertPlotToUploadBody = async (
  plot: MonitoringPlot,
  gallery: PlotImageRecord[] = [],
): Promise<PlotUploadConversion> => {
  const geometry = buildGeometry(plot.location)
  if (!geometry) {
    return { body: null, error: 'Plot has no valid boundary geometry', uploadedImages: [] }
  }

  const cover = plot.cdn_image || plot.local_image
  // Plots recorded before the gallery existed only have the cover photo, so it
  // stands in as a one-photo gallery. When gallery rows exist the cover is one of
  // them and must not be uploaded twice.
  const galleryRows: PlotImageRecord[] = gallery.length > 0
    ? gallery
    : cover
      ? [{ image_id: '', local_uri: cover, cdn_url: '', date_taken: plot.plot_created_at, status: 'NOT_SYNCED' }]
      : []
  const { images, uploaded } = await uploadPlotGallery(galleryRows, cover)
  const plotImage = images.find(i => i.isPrimary)?.filename || images[0]?.filename

  const additional = safeParseObject(plot.meta_data) || {}
  if (plot.additional_data) additional.additionalData = plot.additional_data
  const metadata = Object.keys(additional).length ? additional : undefined

  const plants: any[] = []
  for (const p of plot.plot_plants || []) {
    plants.push(await convertPlotPlant(p))
  }

  const observations = (plot.observations || []).map((o) => ({
    clientId: o.obs_id || undefined,
    type: o.type ? String(o.type).toLowerCase() : 'observation',
    observedAt: toISO(o.obs_date) || new Date().toISOString(),
    unit: o.unit || undefined,
    value: typeof o.value === 'number' ? o.value : undefined,
  }))

  const body = {
    clientId: plot.plot_id,
    name: plot.name || undefined,
    shape: SHAPE_MAP[plot.shape] || undefined,
    plotType: plot.type ? String(plot.type).toLowerCase() : undefined,
    complexity: plot.complexity ? String(plot.complexity).toLowerCase() : undefined,
    radius: plot.radius || undefined,
    length: plot.length || undefined,
    width: plot.width || undefined,
    geometry,
    coords: buildCoords(plot.coords),
    isComplete: plot.is_complete,
    registrationDate: toISO(plot.plot_created_at),
    interventionStartDate: toISO(plot.plot_created_at),
    interventionEndDate: toISO(plot.plot_updated_at),
    captureMode: 'on-site',
    metadata,
    image: plotImage,
    images,
    plants,
    observations,
  }
  return { body, error: null, uploadedImages: uploaded }
}

export interface PlotImagesConversion {
  // null when the plot has no un-uploaded photos to send.
  body: { plotUid: string; images: PlotImagePayload[] } | null
  uploaded: UploadedPlotImage[]
  error: string | null
}

/**
 * Build the add-images payload for an already-synced plot: every gallery row not
 * yet uploaded (status !== 'SYNCED'). Photos keep being added to a plot after it
 * syncs, so they travel on their own. Needs the plot's server uid (stashed in
 * meta_data.serverUid by markMonitoringPlotSynced).
 */
export const buildPlotImagesBody = async (
  plot: MonitoringPlot,
  gallery: PlotImageRecord[],
): Promise<PlotImagesConversion> => {
  const pending = (gallery || []).filter(g => g.status !== 'SYNCED' && (g.local_uri || g.cdn_url))
  if (pending.length === 0) return { body: null, uploaded: [], error: null }

  const serverUid = safeParseObject(plot.meta_data)?.serverUid
  if (!serverUid) {
    // Synced plot with no server uid recorded: can't target the plot remotely.
    return { body: null, uploaded: [], error: 'Plot has no server id; cannot add images' }
  }

  const { images, uploaded } = await uploadPlotGallery(pending, plot.cdn_image || plot.local_image)
  // Every upload failed (offline mid-sync, storage refused): nothing to send, and
  // the rows stay pending for the next run.
  if (images.length === 0) return { body: null, uploaded: [], error: null }

  return { body: { plotUid: serverUid, images }, uploaded, error: null }
}

export interface RemeasurementConversion {
  // null when the plot has no pending remeasurements to upload.
  body: { plants: any[] } | null
  // What each tree's upload covers, so the caller can mark exactly these
  // timeline entries SYNCED once the server accepts them.
  syncedRef: { treeUid: string; timelineIds: string[] }[]
}

/**
 * Build the remeasurement upload payload for an already-synced plot: every
 * NOT_SYNCED timeline entry of every plant that has a server tree id, with its
 * image uploaded. Entries are sent oldest-first so server-side status
 * transitions apply in order. Pass a plain JS snapshot of the plot.
 */
export const buildPlotRemeasurementBody = async (
  plot: MonitoringPlot,
): Promise<RemeasurementConversion> => {
  const plants: any[] = []
  const syncedRef: { treeUid: string; timelineIds: string[] }[] = []

  for (const p of plot.plot_plants || []) {
    if (!p.server_tree_id) continue
    const pending = (p.timeline || [])
      .filter(t => t.sync_status !== 'SYNCED')
      .sort((a, b) => (a.date || 0) - (b.date || 0))
    if (pending.length === 0) continue

    const measurements: any[] = []
    const timelineIds: string[] = []
    for (const t of pending) {
      const image = await uploadPlotImage(t.image)
      measurements.push({
        clientId: t.timeline_id || undefined,
        status: t.status ? String(t.status).toLowerCase() : undefined,
        length: typeof t.length === 'number' ? t.length : undefined,
        width: typeof t.width === 'number' ? t.width : undefined,
        date: toISO(t.date),
        lengthUnit: t.length_unit || undefined,
        widthUnit: t.width_unit || undefined,
        image,
      })
      if (t.timeline_id) timelineIds.push(t.timeline_id)
    }
    plants.push({ treeUid: p.server_tree_id, measurements })
    syncedRef.push({ treeUid: p.server_tree_id, timelineIds })
  }

  if (plants.length === 0) return { body: null, syncedRef: [] }
  return { body: { plants }, syncedRef }
}

export interface NewPlantsConversion {
  // null when the plot has no new (un-uploaded) plants to send.
  body: { plotUid: string; plants: any[] } | null
  error: string | null
}

/**
 * Build the add-plants payload for an already-synced plot: every plant that has
 * no server tree id yet (added after the plot was synced), serialized like the
 * initial upload. Needs the plot's server uid (stashed in meta_data.serverUid by
 * markMonitoringPlotSynced). Pass a plain JS snapshot of the plot.
 */
export const buildPlotNewPlantsBody = async (
  plot: MonitoringPlot,
): Promise<NewPlantsConversion> => {
  const serverUid = safeParseObject(plot.meta_data)?.serverUid
  const newPlants = (plot.plot_plants || []).filter(p => !p.server_tree_id)
  if (newPlants.length === 0) return { body: null, error: null }
  if (!serverUid) {
    // Synced plot with no server uid recorded: can't target the plot remotely.
    return { body: null, error: 'Plot has no server id; cannot add plants' }
  }

  const plants: any[] = []
  for (const p of newPlants) {
    plants.push(await convertPlotPlant(p))
  }
  return { body: { plotUid: serverUid, plants }, error: null }
}

export interface NewObservationsConversion {
  // null when the plot has no new (un-uploaded) observations to send.
  body: { plotUid: string; observations: any[] } | null
  // The obs ids this upload covers, so the caller can mark exactly these
  // observations SYNCED once the server accepts them.
  syncedRef: string[]
  error: string | null
}

/**
 * Build the add-observations payload for an already-synced plot: every
 * observation not yet uploaded (sync_status !== 'SYNCED'), serialized like the
 * initial upload. Needs the plot's server uid (stashed in meta_data.serverUid by
 * markMonitoringPlotSynced). Pass a plain JS snapshot of the plot.
 */
export const buildPlotObservationsBody = async (
  plot: MonitoringPlot,
): Promise<NewObservationsConversion> => {
  const serverUid = safeParseObject(plot.meta_data)?.serverUid
  const pending = (plot.observations || []).filter(o => o.sync_status !== 'SYNCED')
  if (pending.length === 0) return { body: null, syncedRef: [], error: null }
  if (!serverUid) {
    // Synced plot with no server uid recorded: can't target the plot remotely.
    return { body: null, syncedRef: [], error: 'Plot has no server id; cannot add observations' }
  }

  const observations = pending.map((o) => ({
    clientId: o.obs_id || undefined,
    type: o.type ? String(o.type).toLowerCase() : 'observation',
    observedAt: toISO(o.obs_date) || new Date().toISOString(),
    unit: o.unit || undefined,
    value: typeof o.value === 'number' ? o.value : undefined,
  }))
  const syncedRef = pending.map(o => o.obs_id).filter(Boolean)
  return { body: { plotUid: serverUid, observations }, syncedRef, error: null }
}
