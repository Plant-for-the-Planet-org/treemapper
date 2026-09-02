import {
  DraftObservation, DraftTree, PlotDraft, observationIsValid, treeIsValid,
} from '../types';
import { polygonCenter } from './plotGeometry';

/**
 * Turn the wizard draft into the server's CreateMonitoringPlotDto.
 *
 * Notes on the mapping, because a few server behaviours are not obvious:
 *  - `registrationDate` is deliberately not sent. The upload service always
 *    stamps server-now for it (a DB check forbids a future value), so sending
 *    ours would just be ignored.
 *  - `coords` is the plot centre. The mobile app currently writes a malformed
 *    centre and the server ends up with none, so a plot created here is the only
 *    one whose monitoring_plot.center_location is populated.
 *  - Trees are recorded as living. Like the mobile app, this flow captures what is
 *    standing in the plot today, planted or recruit; deaths are recorded later
 *    through a remeasurement, not at creation.
 */

/**
 * Every plot the dashboard creates is a standard plot. The server keeps the field
 * because devices can also record simple plots, so we send the value rather than
 * leaving it null.
 */
const PLOT_COMPLEXITY = 'standard';

/** The words devices send, so plots from either source read the same. */
const ORIGIN_TO_SERVER: Record<string, string> = {
  planted: 'PLANTED',
  recruit: 'RECRUIT',
};

export interface PlotSavePayload {
  clientId: string;
  name?: string;
  shape?: string;
  plotType?: string;
  complexity?: string;
  radius?: number;
  length?: number;
  width?: number;
  geometry: GeoJSON.Polygon;
  coords?: GeoJSON.Point;
  isComplete: boolean;
  plantProjectSite?: string;
  interventionStartDate?: string;
  interventionEndDate?: string;
  metadata?: Record<string, unknown>;
  plants: unknown[];
  observations: unknown[];
}

const latestMeasurementDate = (trees: DraftTree[]): string | null => {
  const dates = trees.flatMap((t) => t.measurements.map((m) => m.date)).filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort()[dates.length - 1];
};

<<<<<<< Updated upstream
/** Maps one draft tree to the server's PlotPlantDto shape. */
export function treeToPlantDto(t: DraftTree) {
  return {
    clientId: t.id,
    tag: t.tag || undefined,
    scientificSpecies: t.scientificSpeciesUid || undefined,
    speciesName: t.speciesName || undefined,
    count: 1,
    plantingDate: t.plantingDate || undefined,
    isAlive: true,
    type: ORIGIN_TO_SERVER[t.origin],
    // Position is optional: left blank, neither is sent.
    latitude: t.latitude ?? undefined,
    longitude: t.longitude ?? undefined,
    timeline: t.measurements.length
      ? t.measurements.map((m) => ({
        clientId: m.id,
        length: m.height ?? undefined,
        width: m.width ?? undefined,
        date: m.date,
        lengthUnit: 'm',
        widthUnit: 'cm',
      }))
      : undefined,
  };
}

/** Maps one draft observation to the server's PlotObservationDto shape. */
export function observationToDto(o: DraftObservation) {
  return {
    clientId: o.id,
    type: o.type,
    observedAt: o.observedAt,
    unit: o.unit || undefined,
    value: o.value ?? undefined,
  };
}

=======
>>>>>>> Stashed changes
export function buildPayload(
  draftId: string,
  plot: PlotDraft,
  trees: DraftTree[],
  observations: DraftObservation[],
  provenance: { treeFile: string | null; observationFile: string | null },
): PlotSavePayload {
  if (!plot.geometry) throw new Error('The plot has no boundary.');

  const savableTrees = trees.filter(treeIsValid);
  const savableObservations = observations.filter(observationIsValid);

  const start = plot.establishedOn;
  const latest = latestMeasurementDate(savableTrees);
  // valid_date_range check: start must not be after end.
  const end = latest && latest > start ? latest : start;

  const center = plot.center ?? polygonCenter(plot.geometry);

  const metadata: Record<string, unknown> = { createdVia: 'web-create' };
  if (provenance.treeFile) metadata.treeSourceFile = provenance.treeFile;
  if (provenance.observationFile) metadata.observationSourceFile = provenance.observationFile;
  if (plot.boundarySource === 'file' && plot.uploadedFileName) {
    metadata.boundarySourceFile = plot.uploadedFileName;
  }

  return {
    clientId: draftId,
    name: plot.name.trim() || undefined,
    shape: plot.shape,
    plotType: plot.plotType || undefined,
    complexity: PLOT_COMPLEXITY,
    // Dimensions only make sense for the shape they describe.
    radius: plot.shape === 'circle' && plot.radius ? plot.radius : undefined,
    length: plot.shape === 'rectangle' && plot.length ? plot.length : undefined,
    width: plot.shape === 'rectangle' && plot.width ? plot.width : undefined,
    geometry: plot.geometry,
    coords: center ? { type: 'Point', coordinates: center } : undefined,
    isComplete: true,
    plantProjectSite: plot.siteUid || undefined,
    interventionStartDate: start,
    interventionEndDate: end,
    metadata,
<<<<<<< Updated upstream
    plants: savableTrees.map(treeToPlantDto),
    observations: savableObservations.map(observationToDto),
=======
    plants: savableTrees.map((t) => ({
      clientId: t.id,
      tag: t.tag || undefined,
      scientificSpecies: t.scientificSpeciesUid || undefined,
      speciesName: t.speciesName || undefined,
      count: 1,
      plantingDate: t.plantingDate || undefined,
      isAlive: true,
      type: ORIGIN_TO_SERVER[t.origin],
      latitude: t.latitude as number,
      longitude: t.longitude as number,
      timeline: t.measurements.length
        ? t.measurements.map((m) => ({
          clientId: m.id,
          length: m.height ?? undefined,
          width: m.width ?? undefined,
          date: m.date,
          lengthUnit: 'm',
          widthUnit: 'cm',
        }))
        : undefined,
    })),
    observations: savableObservations.map((o) => ({
      clientId: o.id,
      type: o.type,
      observedAt: o.observedAt,
      unit: o.unit || undefined,
      value: o.value ?? undefined,
    })),
>>>>>>> Stashed changes
  };
}

/** Blocking problems that must be cleared before the plot can be saved. */
export function validateDraft(plot: PlotDraft, trees: DraftTree[]): string[] {
  const issues: string[] = [];
  if (!plot.name.trim()) issues.push('The plot needs a name.');
  if (!plot.geometry) issues.push('The plot needs a boundary.');
  if (plot.shape === 'circle' && plot.boundarySource === 'map' && !plot.radius) {
    issues.push('A circular plot needs a radius.');
  }
  if (plot.shape === 'rectangle' && plot.boundarySource === 'map' && (!plot.length || !plot.width)) {
    issues.push('A rectangular plot needs a length and a width.');
  }
  if (trees.length > 0 && trees.every((t) => !treeIsValid(t))) {
    issues.push('Every tree row has an error. Fix or remove them before saving.');
  }
  return issues;
}
