/**
 * Draft state for the create-plot wizard. Everything the user builds up across
 * the four steps lives here as plain data, and `buildPayload` turns it into the
 * server's CreateMonitoringPlotDto in one go at save time.
 *
 * Draft rows carry their own `errors` and `warnings` so the review step can show
 * what is wrong per row without re-running validation on every render. An error
 * blocks the save, a warning does not.
 */

export type PlotShape = 'circle' | 'rectangle' | 'polygon';

export type BoundarySource = 'map' | 'file';

/**
 * How the tree came to be in the plot, the same question the mobile app asks:
 * planted by the project, or a recruit that grew there naturally.
 * Sent to the server as PLANTED / RECRUIT, matching what devices send.
 */
export const TREE_ORIGINS = ['planted', 'recruit'] as const;
export type TreeOrigin = (typeof TREE_ORIGINS)[number];

export const ORIGIN_LABELS: Record<TreeOrigin, string> = {
  planted: 'Planted',
  recruit: 'Recruit',
};

export type SpeciesMatch = 'matched' | 'unmatched' | 'pending';

export interface PlotDraft {
  name: string;
  plotType: string;
  shape: PlotShape;
  /** Metres. Radius for a circle, length/width for a rectangle. */
  radius: number | null;
  length: number | null;
  width: number | null;
  /** [lng, lat]. Set by clicking the map, or derived from an uploaded boundary. */
  center: [number, number] | null;
  /** The boundary actually sent to the server, as a bare GeoJSON Polygon. */
  geometry: GeoJSON.Polygon | null;
  boundarySource: BoundarySource;
  uploadedFileName: string | null;
  siteUid: string | null;
  /** ISO date the plot was established. */
  establishedOn: string;
}

export interface DraftMeasurement {
  id: string;
  /** ISO date. */
  date: string;
  /** Metres. */
  height: number | null;
  /** Centimetres. */
  width: number | null;
  errors: string[];
}

export interface DraftTree {
  id: string;
  /** Source CSV row numbers, for pointing the user at the right line. */
  rows: number[];
  tag: string;
  speciesName: string;
  /** scientific_species.uid once matched. Null means it saves as unknown. */
  scientificSpeciesUid: string | null;
  speciesMatch: SpeciesMatch;
  latitude: number | null;
  longitude: number | null;
  plantingDate: string | null;
  origin: TreeOrigin;
  measurements: DraftMeasurement[];
  errors: string[];
  warnings: string[];
}

export interface DraftObservation {
  id: string;
  row: number;
  type: string;
  observedAt: string;
  value: number | null;
  /** Free text, up to 10 characters. Saved exactly as typed. */
  unit: string;
  errors: string[];
}

/** Units are free text, so field teams are not limited to a fixed list. */
export const UNIT_MAX_LENGTH = 10;

export type WizardStep = 'details' | 'trees' | 'observations' | 'review';

export const STEP_ORDER: WizardStep[] = ['details', 'trees', 'observations', 'review'];

export const STEP_LABELS: Record<WizardStep, string> = {
  details: 'Plot details',
  trees: 'Trees',
  observations: 'Observations',
  review: 'Review and save',
};

export interface SiteOption {
  uid: string;
  name: string;
}

/** A tree is only safe to save when it has no blocking errors. */
export const treeIsValid = (t: DraftTree) =>
  t.errors.length === 0 && t.measurements.every((m) => m.errors.length === 0);

export const observationIsValid = (o: DraftObservation) => o.errors.length === 0;
