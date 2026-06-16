import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { presingedUrl } from 'src/api/api.fetch'

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

/**
 * Upload one local image to S3/R2 via a presigned URL and return the stored
 * filename (the value the server persists as the image reference). A file that
 * is already a remote url is returned unchanged so re-syncs don't re-upload.
 * Returns undefined on any failure: images are optional, so a failed image
 * upload must never block the plot from syncing.
 */
export const uploadPlotImage = async (uri?: string): Promise<string | undefined> => {
  if (!uri) return undefined
  if (/^https?:\/\//i.test(uri)) return uri
  try {
    const presigned = await presingedUrl({
      fileName: String(new Date().getTime()),
      fileType: 'image/jpg',
      folder: 'tree',
    })
    if (presigned.success && presigned.response?.code === 'success') {
      const signedUrl = presigned.response.data.data.uploadUrl
      const fileName = presigned.response.data.data.fileName
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: { uri, type: 'image/jpg', name: fileName || 'image.jpg' } as any,
        headers: { 'Content-Type': 'image/jpg' },
      })
      if (uploadResponse.ok) return fileName
    }
  } catch (_) {
    // swallow: image is optional, the plot still uploads without it
  }
  return undefined
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
}

/**
 * Convert a Realm MonitoringPlot into the server upload payload, uploading every
 * referenced image (plot, each plant, each timeline measurement) on the way and
 * replacing the local uri with the stored filename. Pass a plain JS snapshot of
 * the plot (JSON.parse(JSON.stringify(plot))) so live-Realm access doesn't break
 * across the awaited image uploads.
 */
export const convertPlotToUploadBody = async (
  plot: MonitoringPlot,
): Promise<PlotUploadConversion> => {
  const geometry = buildGeometry(plot.location)
  if (!geometry) {
    return { body: null, error: 'Plot has no valid boundary geometry' }
  }

  const plotImage = await uploadPlotImage(plot.cdn_image || plot.local_image)

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
    plants,
    observations,
  }
  return { body, error: null }
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
