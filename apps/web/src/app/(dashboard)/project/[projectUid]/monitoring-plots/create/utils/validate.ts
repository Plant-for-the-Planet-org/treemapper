import {
  DraftMeasurement, DraftObservation, DraftTree, UNIT_MAX_LENGTH,
} from '../types';
import { isInsideBoundary } from './plotGeometry';

/**
 * Value-level validation, shared by the CSV parsers and the review step's inline
 * editors so a row cannot be "fixed" into a state the parser would have rejected.
 *
 * The CSV parsers keep their own checks for text that will not convert at all
 * ("height abc is not a number"); everything about the resulting values lives
 * here.
 */

const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();

export function validateTreeValues(tree: Pick<DraftTree, 'latitude' | 'longitude'>): string[] {
  const errors: string[] = [];
  const { latitude, longitude } = tree;

  if (latitude == null) errors.push('Latitude is missing');
  else if (!Number.isFinite(latitude)) errors.push('Latitude is not a number');
  else if (latitude < -90 || latitude > 90) errors.push('Latitude must be between -90 and 90');

  if (longitude == null) errors.push('Longitude is missing');
  else if (!Number.isFinite(longitude)) errors.push('Longitude is not a number');
  else if (longitude < -180 || longitude > 180) errors.push('Longitude must be between -180 and 180');

  return errors;
}

export function validateMeasurementValues(m: DraftMeasurement): string[] {
  const errors: string[] = [];

  if (!m.date) errors.push('Measurement date is required');
  // The upload service silently clamps a future date to now, which would change
  // the user's history without telling them. Reject it here instead.
  else if (isFuture(m.date)) errors.push('Measurement date is in the future');

  if (m.height != null && (!Number.isFinite(m.height) || m.height < 0)) {
    errors.push('Height cannot be negative');
  }
  if (m.width != null && (!Number.isFinite(m.width) || m.width < 0)) {
    errors.push('Diameter cannot be negative');
  }

  return errors;
}

export function validateObservationValues(
  o: Pick<DraftObservation, 'type' | 'observedAt' | 'value' | 'unit'>,
): string[] {
  const errors: string[] = [];

  if (!o.type.trim()) errors.push('Observation type is required');
  if (!o.observedAt) errors.push('Observation date is required');
  else if (isFuture(o.observedAt)) errors.push('Observation date is in the future');
  if (o.value != null && !Number.isFinite(o.value)) errors.push('Value is not a number');
  // Any unit is allowed, spaces included. Only the length is checked, so the
  // reading stays readable on the plot detail page.
  if (o.unit.length > UNIT_MAX_LENGTH) {
    errors.push(`Unit can be at most ${UNIT_MAX_LENGTH} characters`);
  }

  return errors;
}

/**
 * Refresh a tree's errors and warnings, including boundary-relative warnings that
 * can only be worked out once the plot boundary exists.
 *
 * `keepWarnings` carries forward the parse-time notes (rows disagreeing on
 * species or coordinates) that cannot be recomputed from the collapsed tree.
 */
export function recomputeTree(
  tree: DraftTree,
  boundary: GeoJSON.Polygon | null,
  keepWarnings: string[] = [],
): DraftTree {
  const measurements = tree.measurements.map((m) => ({
    ...m,
    errors: validateMeasurementValues(m),
  }));

  const warnings = [...keepWarnings];

  if (
    tree.latitude != null && tree.longitude != null
    && Number.isFinite(tree.latitude) && Number.isFinite(tree.longitude)
    && !isInsideBoundary(boundary, tree.longitude, tree.latitude)
  ) {
    warnings.push('Sits outside the plot boundary');
  }

  const dates = measurements.map((m) => m.date).filter(Boolean);
  if (new Set(dates).size !== dates.length) warnings.push('Two measurements share the same date');

  if (measurements.length === 0) warnings.push('No measurements recorded');

  return {
    ...tree,
    measurements: [...measurements].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    errors: validateTreeValues(tree),
    warnings: [...new Set(warnings)],
  };
}

/** Parse-time warnings worth preserving across a recompute. */
export const CARRIED_WARNING_PREFIXES = ['Rows disagree'];

export const carriedWarnings = (tree: DraftTree): string[] =>
  tree.warnings.filter((w) => CARRIED_WARNING_PREFIXES.some((p) => w.startsWith(p)));

export function recomputeObservation(o: DraftObservation): DraftObservation {
  return { ...o, errors: validateObservationValues(o) };
}
