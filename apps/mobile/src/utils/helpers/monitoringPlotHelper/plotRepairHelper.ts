import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { polygonCenter } from 'src/utils/helpers/turfHelpers'

/**
 * Working out why a plot will not upload, and repairing what can be repaired.
 *
 * "Fix required" used to end with "edit anything and save", which asks the user
 * to guess. Most of what actually gets a plot rejected is mechanical: a date
 * pair the wrong way round, a centre that was never computed, a name longer
 * than the column. None of that needs a human.
 *
 * What a human is still needed for is anything where the honest repair would be
 * to throw away or invent data: a plot with no boundary, a radius that is a unit
 * mistake, a plot carrying more plants than one upload can hold. Those come back
 * as blockers, worded so the user knows which screen to open.
 *
 * Pure on purpose: it takes a plain snapshot and returns a plan. The Realm write
 * lives in useMonitoringPlotManagement.
 */

/** Mirrors PLOT_LIMITS in apps/server/src/monitoring-plots/dto/monitoring-plots.dto.ts. */
const LIMITS = {
  PLANTS: 2000,
  OBSERVATIONS: 500,
  TIMELINE: 200,
  DIMENSION_M: 5000,
  MEASUREMENT: 100000,
  PLANT_COUNT: 100000,
  TEXT: 255,
} as const

/** Scalar fields to write back on the plot. */
export interface PlotScalarRepairs {
  name?: string
  radius?: number
  length?: number
  width?: number
  plot_updated_at?: number
  coords?: { type: 'Point'; coordinates: number[] }
}

/** Per-plant text trims, addressed by the plant's own id. */
export interface PlantTextRepairs {
  plot_plant_id: string
  tag?: string
  scientificName?: string
  aliases?: string
}

export interface PlotRepairPlan {
  plot: PlotScalarRepairs
  plants: PlantTextRepairs[]
  /** What was put right, for the user to read after the fact. */
  repaired: string[]
  /** What only the user can resolve. Non-empty means do not re-queue. */
  blockers: string[]
}

const trimTo = (value: string | undefined | null, max: number): string | null => {
  const text = value ?? ''
  return text.length > max ? text.slice(0, max).trim() : null
}

/** The boundary rings, or null when there is nothing usable stored. */
const readRings = (plot: MonitoringPlot): number[][][] | null => {
  const raw = plot.location?.coordinates
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw as unknown as string)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    // Depth 3 is an array of rings; depth 2 is a bare ring the convertor wraps.
    return Array.isArray(parsed[0]) && Array.isArray(parsed[0][0]) ? parsed : [parsed]
  } catch (_) {
    return null
  }
}

/**
 * Inspect one plot and plan its repair.
 *
 * Pass a plain snapshot from snapshotPlot(), not a live Realm object, so nothing
 * is read across a write. Never JSON.parse(JSON.stringify(plot)): a grouped plot
 * serialises to a cycle and throws (see snapshotPlot).
 */
export const inspectPlot = (plot: MonitoringPlot): PlotRepairPlan => {
  const plan: PlotRepairPlan = { plot: {}, plants: [], repaired: [], blockers: [] }

  // ---- repairs: mechanical, no judgement needed -----------------------------

  // The upload sends created_at as the start and updated_at as the end, and the
  // database refuses an end before a start (valid_date_range).
  if (plot.plot_created_at && plot.plot_updated_at && plot.plot_updated_at < plot.plot_created_at) {
    plan.plot.plot_updated_at = plot.plot_created_at
    plan.repaired.push('Corrected the plot dates, which ran backwards.')
  }

  const rings = readRings(plot)

  // A centre that is missing or half-written is dropped by the convertor, so the
  // plot uploads without one. It can always be recomputed from the boundary.
  const centre = plot.coords?.coordinates
  if (rings && (!Array.isArray(centre) || centre.length < 2)) {
    const computed = polygonCenter(rings)
    if (computed) {
      plan.plot.coords = { type: 'Point' as const, coordinates: computed }
      plan.repaired.push('Recalculated the plot centre from its boundary.')
    }
  }

  const trimmedName = trimTo(plot.name, LIMITS.TEXT)
  if (trimmedName !== null) {
    plan.plot.name = trimmedName
    plan.repaired.push('Shortened the plot name to the length the server accepts.')
  }

  // A negative dimension is refused outright; zero is fine, since a plot's real
  // size comes from its drawn boundary.
  for (const key of ['radius', 'length', 'width'] as const) {
    const value = plot[key]
    if (typeof value === 'number' && value < 0) {
      plan.plot[key] = 0
      plan.repaired.push(`Cleared a negative ${key}.`)
    }
  }

  let trimmedPlants = 0
  for (const plant of plot.plot_plants ?? []) {
    const repair: PlantTextRepairs = { plot_plant_id: plant.plot_plant_id }
    let touched = false
    for (const key of ['tag', 'scientificName', 'aliases'] as const) {
      const trimmed = trimTo(plant[key], LIMITS.TEXT)
      if (trimmed !== null) {
        repair[key] = trimmed
        touched = true
      }
    }
    if (touched) {
      plan.plants.push(repair)
      trimmedPlants += 1
    }
  }
  if (trimmedPlants > 0) {
    plan.repaired.push(
      `Shortened text on ${trimmedPlants} plant${trimmedPlants === 1 ? '' : 's'}.`,
    )
  }

  // ---- blockers: the repair would mean inventing or discarding data ---------

  if (!rings) {
    plan.blockers.push('This plot has no boundary. Open it and draw the boundary again.')
  }

  for (const key of ['radius', 'length', 'width'] as const) {
    const value = plot[key]
    if (typeof value === 'number' && value > LIMITS.DIMENSION_M) {
      plan.blockers.push(
        `The ${key} is ${value} m, larger than the ${LIMITS.DIMENSION_M} m a plot can be. `
        + 'Open the plot and correct it.',
      )
    }
  }

  const plantCount = (plot.plot_plants ?? []).length
  if (plantCount > LIMITS.PLANTS) {
    plan.blockers.push(
      `This plot holds ${plantCount} plants, more than the ${LIMITS.PLANTS} one upload can carry.`,
    )
  }

  const observationCount = (plot.observations ?? []).length
  if (observationCount > LIMITS.OBSERVATIONS) {
    plan.blockers.push(
      `This plot holds ${observationCount} observations, more than the ${LIMITS.OBSERVATIONS} one upload can carry.`,
    )
  }

  for (const plant of plot.plot_plants ?? []) {
    const timeline = plant.timeline ?? []
    if (timeline.length > LIMITS.TIMELINE) {
      plan.blockers.push(
        `Plant ${plant.tag || plant.plot_plant_id} has ${timeline.length} measurements, `
        + `more than the ${LIMITS.TIMELINE} one upload can carry.`,
      )
      break
    }
    const wild = timeline.find(
      t => Math.abs(t.length ?? 0) > LIMITS.MEASUREMENT || Math.abs(t.width ?? 0) > LIMITS.MEASUREMENT,
    )
    if (wild) {
      plan.blockers.push(
        `Plant ${plant.tag || plant.plot_plant_id} has a height or width the server will not accept. `
        + 'Open the plant and check its measurements.',
      )
      break
    }
  }

  const overCounted = (plot.plot_plants ?? []).find(p => (p.count ?? 1) > LIMITS.PLANT_COUNT)
  if (overCounted) {
    plan.blockers.push(
      `Plant ${overCounted.tag || overCounted.plot_plant_id} records more stems than the server accepts.`,
    )
  }

  return plan
}
