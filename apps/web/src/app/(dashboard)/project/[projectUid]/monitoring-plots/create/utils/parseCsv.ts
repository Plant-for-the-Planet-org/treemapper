import Papa from 'papaparse';
import {
  DraftMeasurement, DraftObservation, DraftTree, PlotDraft, PlotShape, TreeOrigin,
} from '../types';
import { ColumnMapping, FieldSpec, OBSERVATION_FIELDS, TREE_FIELDS, autoMapColumns } from './csvFields';
import { validateMeasurementValues, validateObservationValues, validateTreeValues } from './validate';

/**
 * CSV reading for the create-plot wizard: header sampling for the mapping dialog,
 * then a full parse into draft rows with per-row validation.
 *
 * Validation is strict about anything the server would silently absorb. A future
 * measurement date is the clearest case: the upload service clamps recordedAt to
 * now (monitoring-plots.service.ts), so a typo'd year would be accepted and quietly
 * change the user's history. We reject it here instead.
 */

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(seq += 1)}`;

export interface CsvSample {
  headers: string[];
  sampleRows: Record<string, string>[];
  rowCount: number;
}

export function readCsvSample(file: File): Promise<CsvSample> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => resolve({
        headers: (result.meta.fields ?? []).filter(Boolean),
        sampleRows: result.data.slice(0, 5),
        rowCount: result.data.length,
      }),
      error: reject,
    });
  });
}

function readRows(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (result) => resolve(result.data),
      error: reject,
    });
  });
}

// ─── value coercion ──────────────────────────────────────────────────────────

const cell = (row: Record<string, string>, mapping: ColumnMapping, key: string): string => {
  const header = mapping[key];
  if (!header) return '';
  return (row[header] ?? '').toString().trim();
};

const toNumber = (raw: string): number | null => {
  if (!raw) return null;
  // Tolerate a comma decimal separator, common in European exports.
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/**
 * Accepts YYYY-MM-DD (and full ISO) plus DD/MM/YYYY, matching the day-first
 * convention the intervention importer already uses. Returns an ISO string.
 */
export function parseDate(raw: string): { iso: string | null; error: string | null } {
  const s = raw.trim();
  if (!s) return { iso: null, error: null };

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return { iso: null, error: `"${s}" is not a real date` };
    return { iso: d.toISOString(), error: null };
  }

  const dayFirst = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = Number(dayFirst[2]);
    const year = Number(dayFirst[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { iso: null, error: `"${s}" is not a real date` };
    }
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
      return { iso: null, error: `"${s}" is not a real date` };
    }
    return { iso: d.toISOString(), error: null };
  }

  return { iso: null, error: `"${s}" is not a date we recognise. Use YYYY-MM-DD` };
}

const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();

/**
 * Planted or recruit, the same question the mobile app asks. Anything that reads
 * as natural regeneration counts as a recruit; everything else, blank included,
 * is treated as planted.
 */
export const parseOrigin = (raw: string): TreeOrigin => {
  const s = raw.trim().toLowerCase();
  const recruit = ['recruit', 'recruited', 'natural', 'naturally', 'regeneration', 'volunteer', 'wild'];
  return recruit.some((word) => s === word || s.startsWith(`${word} `)) ? 'recruit' : 'planted';
};

// ─── trees ───────────────────────────────────────────────────────────────────

interface RawTreeRow {
  row: number;
  tag: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  plantingDate: string | null;
  origin: TreeOrigin;
  measurement: DraftMeasurement | null;
  errors: string[];
}

function readTreeRow(
  row: Record<string, string>,
  mapping: ColumnMapping,
  index: number,
): RawTreeRow {
  const rowNumber = index + 2; // +1 for the header, +1 for 1-based counting
  const errors: string[] = [];

  // Range and presence checks are shared with the review step's editors; only
  // the "this text will not convert at all" cases are handled here.
  const latitude = toNumber(cell(row, mapping, 'latitude'));
  const longitude = toNumber(cell(row, mapping, 'longitude'));
  errors.push(...validateTreeValues({ latitude, longitude }));

  const planting = parseDate(cell(row, mapping, 'plantingDate'));
  if (planting.error) errors.push(`Planting date: ${planting.error}`);
  else if (planting.iso && isFuture(planting.iso)) errors.push('Planting date is in the future');

  const measured = parseDate(cell(row, mapping, 'measurementDate'));
  if (measured.error) errors.push(`Measurement date: ${measured.error}`);

  const rawHeight = cell(row, mapping, 'height');
  const rawWidth = cell(row, mapping, 'width');
  const height = toNumber(rawHeight);
  const width = toNumber(rawWidth);
  if (rawHeight && height == null) errors.push(`Height "${rawHeight}" is not a number`);
  if (rawWidth && width == null) errors.push(`Diameter "${rawWidth}" is not a number`);

  // A row only becomes a measurement when it carries something measured.
  let measurement: DraftMeasurement | null = null;
  const hasMeasurement = !!measured.iso || height != null || width != null;
  if (hasMeasurement) {
    const candidate: DraftMeasurement = {
      id: nextId('m'),
      date: measured.iso ?? '',
      height,
      width,
      errors: [],
    };
    // The date error is already reported on the row, so do not repeat it here.
    candidate.errors = measured.error
      ? validateMeasurementValues(candidate).filter((e) => !e.startsWith('Measurement date'))
      : validateMeasurementValues(candidate);
    measurement = candidate;
  }

  return {
    row: rowNumber,
    tag: cell(row, mapping, 'tag'),
    species: cell(row, mapping, 'species'),
    latitude,
    longitude,
    plantingDate: planting.iso,
    origin: parseOrigin(cell(row, mapping, 'origin')),
    measurement,
    errors,
  };
}

/**
 * Parse the tree CSV into draft trees. Rows sharing a tag collapse into one tree
 * carrying a measurement timeline, oldest first, so a sheet with years of
 * monitoring imports as history rather than as duplicate trees. Rows with no tag
 * each become their own tree.
 */
export async function parseTrees(file: File, mapping: ColumnMapping): Promise<DraftTree[]> {
  const rows = await readRows(file);
  const raw = rows.map((r, i) => readTreeRow(r, mapping, i));

  const byTag = new Map<string, RawTreeRow[]>();
  const untagged: RawTreeRow[] = [];
  for (const r of raw) {
    const key = r.tag.trim().toLowerCase();
    if (!key) {
      untagged.push(r);
      continue;
    }
    if (!byTag.has(key)) byTag.set(key, []);
    byTag.get(key)!.push(r);
  }

  const trees: DraftTree[] = [];

  const build = (group: RawTreeRow[]): DraftTree => {
    const measurements = group
      .map((r) => r.measurement)
      .filter((m): m is DraftMeasurement => m !== null)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // The tree's own attributes come from the earliest row that has them.
    const ordered = [...group].sort((a, b) => {
      const da = a.measurement?.date || '';
      const db = b.measurement?.date || '';
      return da.localeCompare(db);
    });
    const primary = ordered[0];

    const errors = [...new Set(ordered.flatMap((r) => r.errors))];
    const warnings: string[] = [];

    const species = ordered.find((r) => r.species)?.species ?? '';
    const conflictingSpecies = new Set(
      ordered.map((r) => r.species.trim().toLowerCase()).filter(Boolean),
    );
    if (conflictingSpecies.size > 1) {
      warnings.push(`Rows disagree on species. Using "${species}"`);
    }

    const located = ordered.filter((r) => r.latitude != null && r.longitude != null);
    if (located.length > 1) {
      const moved = located.some(
        (r) => r.latitude !== located[0].latitude || r.longitude !== located[0].longitude,
      );
      if (moved) warnings.push('Rows disagree on coordinates. Using the earliest row');
    }

    const dates = measurements.map((m) => m.date).filter(Boolean);
    if (new Set(dates).size !== dates.length) {
      warnings.push('Two measurements share the same date');
    }

    if (new Set(ordered.map((r) => r.origin)).size > 1) {
      warnings.push(`Rows disagree on planted or recruit. Using "${primary.origin}"`);
    }

    return {
      id: nextId('t'),
      rows: ordered.map((r) => r.row),
      tag: primary.tag,
      speciesName: species,
      scientificSpeciesUid: null,
      speciesMatch: species ? 'pending' : 'unmatched',
      latitude: located[0]?.latitude ?? primary.latitude,
      longitude: located[0]?.longitude ?? primary.longitude,
      plantingDate: ordered.find((r) => r.plantingDate)?.plantingDate ?? null,
      origin: primary.origin,
      measurements,
      errors,
      warnings,
    };
  };

  for (const group of byTag.values()) trees.push(build(group));
  for (const single of untagged) trees.push(build([single]));

  return trees;
}

// ─── observations ────────────────────────────────────────────────────────────

export async function parseObservations(
  file: File,
  mapping: ColumnMapping,
): Promise<DraftObservation[]> {
  const rows = await readRows(file);

  return rows.map((row, i) => {
    const errors: string[] = [];

    const observed = parseDate(cell(row, mapping, 'observedAt'));
    if (observed.error) errors.push(observed.error);

    const rawValue = cell(row, mapping, 'value');
    const value = toNumber(rawValue);
    if (rawValue && value == null) errors.push(`Value "${rawValue}" is not a number`);

    // The server stores the type as free text; keep it lowercase and underscored
    // so repeat imports group into one series on the plot detail page.
    const type = cell(row, mapping, 'type').toLowerCase().replace(/\s+/g, '_');
    const observedAt = observed.iso ?? '';
    // The unit is kept exactly as written, spaces included. Whatever the team
    // uses is what the server stores.
    const unit = cell(row, mapping, 'unit');

    const shared = observed.error
      ? validateObservationValues({ type, observedAt, value, unit })
        .filter((e) => !e.startsWith('Observation date'))
      : validateObservationValues({ type, observedAt, value, unit });

    return {
      id: nextId('o'),
      row: i + 2,
      type,
      observedAt,
      value,
      unit,
      errors: [...errors, ...shared],
    };
  });
}

// ─── optional plot details sheet ─────────────────────────────────────────────

const PLOT_ALIASES: Record<string, string[]> = {
  name: ['name', 'plotname', 'plot'],
  plotType: ['plottype', 'type'],
  shape: ['shape'],
  radius: ['radiusm', 'radius'],
  length: ['lengthm', 'length'],
  width: ['widthm', 'width'],
  latitude: ['centerlatitude', 'centrelatitude', 'latitude', 'lat'],
  longitude: ['centerlongitude', 'centrelongitude', 'longitude', 'lng', 'lon'],
  establishedOn: ['establishedon', 'establisheddate', 'date'],
};

/**
 * Read the first row of the plot template to pre-fill step 1. Anything the sheet
 * does not carry is left untouched, so a partly filled template still helps.
 */
export async function parsePlotDetails(file: File): Promise<Partial<PlotDraft>> {
  const rows = await readRows(file);
  if (rows.length === 0) throw new Error('The file has no rows.');
  const row = rows[0];

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const headers = Object.keys(row);
  const find = (key: string): string => {
    for (const alias of PLOT_ALIASES[key] ?? []) {
      const match = headers.find((h) => norm(h) === alias);
      if (match) return (row[match] ?? '').toString().trim();
    }
    return '';
  };

  const draft: Partial<PlotDraft> = {};
  const name = find('name');
  if (name) draft.name = name;

  const plotType = find('plotType').toLowerCase();
  if (plotType === 'intervention' || plotType === 'control') draft.plotType = plotType;

  const shape = find('shape').toLowerCase();
  if (shape === 'circle' || shape === 'rectangle') draft.shape = shape as PlotShape;

  const radius = toNumber(find('radius'));
  if (radius != null) draft.radius = radius;
  const length = toNumber(find('length'));
  if (length != null) draft.length = length;
  const width = toNumber(find('width'));
  if (width != null) draft.width = width;

  const lat = toNumber(find('latitude'));
  const lng = toNumber(find('longitude'));
  if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    draft.center = [lng, lat];
  }

  const established = parseDate(find('establishedOn'));
  if (established.iso && !isFuture(established.iso)) draft.establishedOn = established.iso;

  return draft;
}

// ─── re-exports so steps import from one place ────────────────────────────────

export { TREE_FIELDS, OBSERVATION_FIELDS, autoMapColumns };
export type { ColumnMapping, FieldSpec };
