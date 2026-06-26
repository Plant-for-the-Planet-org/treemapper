import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';

/**
 * Pure analytics for a monitoring plot: derived field-science metrics
 * (survival, stem density, diversity), cohort growth binning, and the local
 * planar coordinates used to draw the stem-map schematic. No React here.
 */

export type TimelineEntry = {
  uid: string;
  recordType: string;
  recordedAt: string | null;
  height: number | null;
  width: number | null;
  previousStatus: string | null;
  newStatus: string | null;
  image: string | null;
};

export type PlotPlant = {
  uid: string;
  hid: string;
  tag: string | null;
  speciesName: string | null;
  commonName: string | null;
  isUnknown: boolean | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  height: number | null;
  width: number | null;
  plantingDate: string | null;
  lastMeasurementDate: string | null;
  remeasured: boolean | null;
  timeline: TimelineEntry[];
};

export type PlotSpecies = {
  uid: string;
  speciesName: string | null;
  commonName: string | null;
  speciesCount: number;
  isUnknown: boolean;
};

export type PlotObservation = {
  uid: string;
  type: string;
  observedAt: string | null;
  unit: string | null;
  value: number | null;
};

export type PlotDetail = {
  uid: string;
  hid: string;
  name: string | null;
  shape: string | null;
  plotType: string | null;
  complexity: string | null;
  radius: number | null;
  length: number | null;
  width: number | null;
  isComplete: boolean | null;
  captureMode: string | null;
  reviewStatus: string | null;
  totalTreeCount: number | null;
  geometry: Feature | FeatureCollection | Geometry | null;
  center: Point | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
  registrationDate: string | null;
  site: { uid: string; name: string } | null;
  group: { uid: string; name: string } | null;
  species: PlotSpecies[];
  observations: PlotObservation[];
  plants: PlotPlant[];
};

export const STATUS_ORDER = ['alive', 'sick', 'removed', 'dead', 'unknown'] as const;

export const STATUS_COLOR: Record<string, string> = {
  alive: '#16a34a',
  dead: '#dc2626',
  sick: '#d97706',
  removed: '#6b7280',
  unknown: '#9ca3af',
};

// Forest-green-led series palette for species composition (matches app charts).
export const SPECIES_COLORS = ['#007A49', '#3f9d6f', '#7bbf9a', '#b9d9c6', '#d97706', '#2563eb', '#9333ea', '#0891b2'];

const norm = (s?: string | null) => (s || 'unknown').toLowerCase();

/** Shannon diversity index H' from per-species counts. */
export function shannon(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  return -counts.reduce((acc, c) => {
    if (!c) return acc;
    const p = c / total;
    return acc + p * Math.log(p);
  }, 0);
}

/** Pielou evenness J' (0..1). */
export function evenness(counts: number[]): number {
  const s = counts.filter((c) => c > 0).length;
  if (s <= 1) return s === 1 ? 1 : 0;
  return shannon(counts) / Math.log(s);
}

/** Plot area in m². Prefers explicit dimensions, falls back to polygon geometry. */
export function plotArea(p: PlotDetail): number | null {
  if (p.shape === 'circle' && p.radius != null) return Math.PI * p.radius * p.radius;
  if (p.shape === 'rectangle' && p.length != null && p.width != null) return p.length * p.width;
  try {
    if (p.geometry) {
      const a = turf.area(p.geometry);
      if (a > 0) return a;
    }
  } catch {
    // invalid geometry: no area
  }
  return null;
}

export type PlotMetrics = {
  total: number;
  alive: number;
  dead: number;
  sick: number;
  removed: number;
  unknown: number;
  survival: number | null;
  area: number | null;
  density: number | null;
  richness: number;
  shannon: number;
  evenness: number;
  meanHeight: number | null;
  meanWidth: number | null;
};

export function plotMetrics(p: PlotDetail): PlotMetrics {
  const counts = { alive: 0, dead: 0, sick: 0, removed: 0, unknown: 0 } as Record<string, number>;
  p.plants.forEach((t) => {
    const s = norm(t.status);
    counts[s] = (counts[s] ?? 0) + 1;
  });
  const total = p.plants.length;
  const alive = counts.alive || 0;
  const survival = total ? (alive / total) * 100 : null;
  const area = plotArea(p);
  const density = area ? alive / (area / 10000) : null;

  const specCounts = p.species.map((s) => s.speciesCount);
  const heights = p.plants.map((t) => t.height).filter((h): h is number => h != null);
  const widths = p.plants.map((t) => t.width).filter((w): w is number => w != null);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  return {
    total,
    alive,
    dead: counts.dead || 0,
    sick: counts.sick || 0,
    removed: counts.removed || 0,
    unknown: counts.unknown || 0,
    survival,
    area,
    density,
    richness: p.species.length,
    shannon: shannon(specCounts),
    evenness: evenness(specCounts),
    meanHeight: mean(heights),
    meanWidth: mean(widths),
  };
}

export type GrowthPoint = { key: string; label: string; height: number | null; width: number | null; n: number };

/**
 * Cohort growth: every plant timeline measurement is pooled and binned by month,
 * giving mean height/width per period across the plot. Sorted oldest -> newest.
 */
export function cohortGrowth(p: PlotDetail): GrowthPoint[] {
  const buckets = new Map<string, { h: number[]; w: number[] }>();
  p.plants.forEach((t) => {
    t.timeline.forEach((e) => {
      if (!e.recordedAt) return;
      const d = new Date(e.recordedAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!buckets.has(key)) buckets.set(key, { h: [], w: [] });
      const b = buckets.get(key)!;
      if (e.height != null) b.h.push(e.height);
      if (e.width != null) b.w.push(e.width);
    });
  });
  const mean = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null);
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, b]) => {
      const [y, m] = key.split('-');
      const label = new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { key, label, height: mean(b.h), width: mean(b.w), n: Math.max(b.h.length, b.w.length) };
    });
}

export type ObsSeries = {
  type: string;
  label: string;
  unit: string | null;
  points: { date: string | null; label: string; value: number | null }[];
  last: number | null;
  delta: number | null;
};

/** Group flat plot observations into per-type time series with a trend delta. */
export function observationSeries(p: PlotDetail): ObsSeries[] {
  const byType = new Map<string, PlotObservation[]>();
  p.observations.forEach((o) => {
    if (!byType.has(o.type)) byType.set(o.type, []);
    byType.get(o.type)!.push(o);
  });
  return Array.from(byType.entries()).map(([type, rows]) => {
    const sorted = [...rows].sort((a, b) => new Date(a.observedAt || 0).getTime() - new Date(b.observedAt || 0).getTime());
    const points = sorted.map((o) => ({
      date: o.observedAt,
      label: o.observedAt ? new Date(o.observedAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '',
      value: o.value,
    }));
    const vals = points.map((p2) => p2.value).filter((v): v is number => v != null);
    const last = vals.length ? vals[vals.length - 1] : null;
    const first = vals.length ? vals[0] : null;
    const delta = first != null && last != null && first !== 0 ? +(((last - first) / Math.abs(first)) * 100).toFixed(0) : null;
    return {
      type,
      label: type.replace(/_/g, ' '),
      unit: sorted.find((o) => o.unit)?.unit ?? null,
      points,
      last,
      delta,
    };
  });
}

export type StemPoint = {
  uid: string;
  tag: string | null;
  species: string | null;
  status: string;
  height: number | null;
  width: number | null;
  x: number; // metres east of plot centre
  y: number; // metres north of plot centre
};

export type StemLayout = { stems: StemPoint[]; extent: number };

/**
 * Project each tagged plant into local planar metres relative to the plot centre
 * (equirectangular approximation), for the stem-map schematic. `extent` is the
 * frame half-size in metres (plot radius, or the stem spread when unknown).
 */
export function stemLayout(p: PlotDetail): StemLayout {
  const located = p.plants.filter(
    (t) => typeof t.latitude === 'number' && typeof t.longitude === 'number',
  );
  if (located.length === 0) return { stems: [], extent: p.radius || 10 };

  let cLng: number;
  let cLat: number;
  const c = p.center?.coordinates;
  if (Array.isArray(c) && c.length >= 2) {
    cLng = c[0];
    cLat = c[1];
  } else {
    cLng = located.reduce((a, t) => a + (t.longitude as number), 0) / located.length;
    cLat = located.reduce((a, t) => a + (t.latitude as number), 0) / located.length;
  }
  const mPerLng = Math.cos((cLat * Math.PI) / 180) * 111320;
  const mPerLat = 110540;

  const stems: StemPoint[] = located.map((t) => ({
    uid: t.uid,
    tag: t.tag,
    species: t.speciesName,
    status: norm(t.status),
    height: t.height,
    width: t.width,
    x: ((t.longitude as number) - cLng) * mPerLng,
    y: ((t.latitude as number) - cLat) * mPerLat,
  }));

  let extent = p.radius || 0;
  if (!extent) {
    extent = Math.max(1, ...stems.map((s) => Math.max(Math.abs(s.x), Math.abs(s.y)))) * 1.1;
  }
  return { stems, extent };
}

export const fmt = (n: number | null | undefined, d = 0) =>
  n == null || isNaN(n as number) ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
