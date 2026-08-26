// Column definitions and row builders for the Data Explorer export.
//
// The platform Data Explorer shipped an XLSX with two sheets: the data, and a
// READ ME sheet explaining every column. That contract is kept here, with the
// column set widened to everything the export API actually returns.
//
// Row shape matches the old export too: one row per intervention per species,
// so a multi-species planting produces one line per species and `tree_count`
// is that species' count. Interventions with no species recorded still produce
// a single row, otherwise they would silently vanish from the file.

import type { CsvRow } from '@/utils/spreadsheet'

/**
 * The subset of the export API payload this file reads. Field names must track
 * `ExportedIntervention` on the server: the previous version of this page read
 * names that did not exist (treeCount, species, originalGeometry, country),
 * which is why tree counts and geometry came out of the file empty.
 */
export interface ExportedSpecies {
  speciesId?: string
  scientificSpeciesId?: number | null
  speciesName?: string | null
  scientificName?: string | null
  commonName?: string | null
  isUnknownSpecies?: boolean
  treeCount?: number | null
}

export interface ExportedTree {
  treeId?: string
  humanReadableId?: string
  tag?: string | null
  treeType?: string
  status?: string
  statusReason?: string | null
  statusChangedAt?: string | null
  speciesName?: string | null
  currentHeight?: number | null
  currentWidth?: number | null
  currentHealthScore?: number | null
  plantingDate?: string | null
  coordinates?: {
    latitude?: number | null
    longitude?: number | null
    altitude?: number | null
    accuracy?: number | null
  }
  lastMeasurementDate?: string | null
  nextMeasurementDate?: string | null
  image?: string | null
  isFlagged?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ExportedIntervention {
  interventionId?: string
  humanReadableId?: string
  interventionType?: string
  status?: string
  isPrivate?: boolean
  registrationDate?: string
  interventionStartDate?: string
  interventionEndDate?: string
  createdAt?: string
  lastUpdatedAt?: string
  location?: unknown
  deviceLocation?: unknown
  area?: number | null
  totalTreeCount?: number | null
  sampleTreeCount?: number | null
  speciesPlanted?: ExportedSpecies[]
  captureMode?: string
  captureStatus?: string
  imageUrl?: string | null
  description?: string | null
  metadata?: unknown
  project?: { id?: number; name?: string; slug?: string } | null
  site?: { uid?: string; name?: string } | null
  createdBy?: { displayName?: string | null; email?: string } | null
  trees?: ExportedTree[]
  isFlagged?: boolean
  flagReasons?: unknown
  isMigrated?: boolean
}

export interface ExportColumn {
  key: string
  description: string
}

export const INTERVENTION_COLUMNS: ExportColumn[] = [
  { key: 'hid', description: 'Human readable ID of the intervention' },
  { key: 'intervention_id', description: 'Stable unique ID of the intervention' },
  { key: 'type', description: 'Intervention type, for example single-tree-registration' },
  { key: 'status', description: 'Lifecycle status: planned, active or completed' },
  { key: 'intervention_start_date', description: 'Date the intervention started' },
  { key: 'intervention_end_date', description: 'Date the intervention ended' },
  { key: 'registration_date', description: 'Date the intervention was recorded' },
  { key: 'species', description: 'Name of the species planted on this row' },
  { key: 'scientific_name', description: 'Scientific name, empty for unknown species' },
  { key: 'common_name', description: 'Common name where one is known' },
  { key: 'is_unknown_species', description: 'true when the species was recorded as free text' },
  { key: 'tree_count', description: 'Trees of this species in this intervention' },
  { key: 'total_trees_planted', description: 'Total trees across all species in this intervention' },
  { key: 'sample_tree_count', description: 'Number of sample trees measured on this intervention' },
  { key: 'species_count', description: 'Number of distinct species in this intervention' },
  { key: 'area_ha', description: 'Area of the intervention in hectares, where a polygon exists' },
  { key: 'geometry', description: 'GeoJSON geometry of the intervention as a JSON string' },
  { key: 'site_name', description: 'Site the intervention belongs to' },
  { key: 'site_id', description: 'Stable unique ID of the site' },
  { key: 'project_name', description: 'Project the intervention belongs to' },
  { key: 'project_id', description: 'Backend ID of the project' },
  { key: 'capture_mode', description: 'Whether the record was captured on site or off site' },
  { key: 'capture_status', description: 'Whether capture is complete or partial' },
  { key: 'recorded_by', description: 'Name of the person who recorded the intervention' },
  { key: 'recorded_by_email', description: 'Email of the person who recorded the intervention' },
  { key: 'description', description: 'Free text notes on the intervention' },
  { key: 'image_url', description: 'Photo attached to the intervention' },
  { key: 'metadata', description: 'Extra key/value data recorded by the app, as a JSON string' },
  { key: 'device_location', description: 'Device position at capture time, as a JSON string' },
  { key: 'is_private', description: 'true when the intervention is hidden from public views' },
  { key: 'is_flagged', description: 'true when the intervention has been flagged for review' },
  { key: 'flag_reasons', description: 'Reasons the intervention was flagged' },
  { key: 'is_migrated', description: 'true when the record came from the old platform' },
  { key: 'created_at', description: 'Timestamp the record was created' },
  { key: 'updated_at', description: 'Timestamp the record was last changed' },
]

export const TREE_COLUMNS: ExportColumn[] = [
  { key: 'tree_hid', description: 'Human readable ID of the tree' },
  { key: 'tree_id', description: 'Stable unique ID of the tree' },
  { key: 'intervention_hid', description: 'Human readable ID of the parent intervention' },
  { key: 'tag', description: 'Physical tag number on the tree' },
  { key: 'tree_type', description: 'sample or single' },
  { key: 'species_name', description: 'Species recorded for this tree' },
  { key: 'status', description: 'alive, dead or unknown' },
  { key: 'status_reason', description: 'Reason recorded for the current status' },
  { key: 'status_changed_at', description: 'When the status last changed' },
  { key: 'height_m', description: 'Latest measured height in metres' },
  { key: 'width_cm', description: 'Latest measured width in centimetres' },
  { key: 'health_score', description: 'Latest health score, 0 to 100' },
  { key: 'latitude', description: 'Latitude in decimal degrees' },
  { key: 'longitude', description: 'Longitude in decimal degrees' },
  { key: 'altitude', description: 'Altitude in metres' },
  { key: 'accuracy', description: 'GPS accuracy in metres at capture time' },
  { key: 'planting_date', description: 'Date the tree was planted' },
  { key: 'last_measurement_date', description: 'Date of the most recent measurement' },
  { key: 'next_measurement_date', description: 'Date the next measurement is due' },
  { key: 'image', description: 'Photo attached to the tree' },
  { key: 'is_flagged', description: 'true when the tree has been flagged for review' },
  { key: 'created_at', description: 'Timestamp the record was created' },
  { key: 'updated_at', description: 'Timestamp the record was last changed' },
]

export const INTERVENTION_HEADERS = INTERVENTION_COLUMNS.map((c) => c.key)
export const TREE_HEADERS = TREE_COLUMNS.map((c) => c.key)

export function readmeRows(columns: ExportColumn[]): CsvRow[] {
  return columns.map((c) => ({ column_title: c.key, description: c.description }))
}

const asJson = (value: unknown): string =>
  value === null || value === undefined ? '' : JSON.stringify(value)

const asDate = (value: unknown): string => {
  if (!value) return ''
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}

const asNumber = (value: unknown): number | '' =>
  value === null || value === undefined || value === '' ? '' : Number(value)

/** Turns the export API payload into flat rows, one per intervention per species. */
export function buildInterventionRows(interventions: ExportedIntervention[]): CsvRow[] {
  const rows: CsvRow[] = []

  interventions.forEach((item) => {
    const species = Array.isArray(item.speciesPlanted) ? item.speciesPlanted : []

    const base: CsvRow = {
      hid: item.humanReadableId ?? '',
      intervention_id: item.interventionId ?? '',
      type: item.interventionType ?? '',
      status: item.status ?? '',
      intervention_start_date: asDate(item.interventionStartDate),
      intervention_end_date: asDate(item.interventionEndDate),
      registration_date: asDate(item.registrationDate),
      total_trees_planted: asNumber(item.totalTreeCount) === '' ? 0 : Number(item.totalTreeCount),
      sample_tree_count: asNumber(item.sampleTreeCount) === '' ? 0 : Number(item.sampleTreeCount),
      species_count: species.length,
      // `area` is stored in square metres; the sheet reports hectares.
      area_ha: item.area != null ? Number((Number(item.area) / 10000).toFixed(4)) : '',
      geometry: asJson(item.location),
      site_name: item.site?.name ?? '',
      site_id: item.site?.uid ?? '',
      project_name: item.project?.name ?? '',
      project_id: item.project?.id ?? '',
      capture_mode: item.captureMode ?? '',
      capture_status: item.captureStatus ?? '',
      recorded_by: item.createdBy?.displayName ?? '',
      recorded_by_email: item.createdBy?.email ?? '',
      description: item.description ?? '',
      image_url: item.imageUrl ?? '',
      metadata: asJson(item.metadata),
      device_location: asJson(item.deviceLocation),
      is_private: Boolean(item.isPrivate),
      is_flagged: Boolean(item.isFlagged),
      flag_reasons: asJson(item.flagReasons),
      is_migrated: Boolean(item.isMigrated),
      created_at: asDate(item.createdAt),
      updated_at: asDate(item.lastUpdatedAt),
    }

    if (species.length === 0) {
      rows.push({
        ...base,
        species: '',
        scientific_name: '',
        common_name: '',
        is_unknown_species: '',
        tree_count: '',
      })
      return
    }

    species.forEach((sp) => {
      rows.push({
        ...base,
        species: sp.speciesName ?? sp.scientificName ?? sp.commonName ?? 'Unknown',
        scientific_name: sp.scientificName ?? '',
        common_name: sp.commonName ?? '',
        is_unknown_species: Boolean(sp.isUnknownSpecies),
        tree_count: asNumber(sp.treeCount) === '' ? 0 : Number(sp.treeCount),
      })
    })
  })

  return rows
}

export function buildTreeRows(interventions: ExportedIntervention[]): CsvRow[] {
  const rows: CsvRow[] = []

  interventions.forEach((item) => {
    const trees = Array.isArray(item.trees) ? item.trees : []
    trees.forEach((t) => {
      rows.push({
        tree_hid: t.humanReadableId ?? '',
        tree_id: t.treeId ?? '',
        intervention_hid: item.humanReadableId ?? '',
        tag: t.tag ?? '',
        tree_type: t.treeType ?? '',
        species_name: t.speciesName ?? '',
        status: t.status ?? '',
        status_reason: t.statusReason ?? '',
        status_changed_at: asDate(t.statusChangedAt),
        height_m: asNumber(t.currentHeight),
        width_cm: asNumber(t.currentWidth),
        health_score: asNumber(t.currentHealthScore),
        latitude: asNumber(t.coordinates?.latitude),
        longitude: asNumber(t.coordinates?.longitude),
        altitude: asNumber(t.coordinates?.altitude),
        accuracy: asNumber(t.coordinates?.accuracy),
        planting_date: asDate(t.plantingDate),
        last_measurement_date: asDate(t.lastMeasurementDate),
        next_measurement_date: asDate(t.nextMeasurementDate),
        image: t.image ?? '',
        is_flagged: Boolean(t.isFlagged),
        created_at: asDate(t.createdAt),
        updated_at: asDate(t.updatedAt),
      })
    })
  })

  return rows
}
