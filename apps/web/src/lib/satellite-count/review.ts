/**
 * Review model and persistence for satellite tree counts.
 *
 * Persistence is browser-local for now (localStorage, keyed by intervention).
 * `persistReview` is the single place to switch to the TreeMapper API once an
 * endpoint exists for storing the reviewed GeoJSON on the intervention.
 */
import type { AnalysisResult, AnalysisSummary } from './api';
import type { BBox } from './mercator';
import type { ImageryMetadata } from './wayback';

export interface CaptureInfo {
  releaseNum: number;
  releaseLabel: string;
  releaseUrlTemplate: string;
  zoom: number;
  gsd: number;
  bounds: BBox;
  width: number;
  height: number;
  totalTiles: number;
  missingTiles: number;
  blankTiles: number;
  imagery: ImageryMetadata | null;
  capturedAt: string;
}

export interface PendingJob {
  jobId: string;
  apiUrl: string;
  submittedAt: string;
  capture: CaptureInfo;
  minScore: number;
}

export type PointSource = 'ai' | 'manual';
export type PointStatus = 'confirmed' | 'rejected';

export interface ReviewPoint {
  key: string;
  lon: number;
  lat: number;
  source: PointSource;
  status: PointStatus;
  score?: number;
  crownDiameterM?: number;
  aiId?: number;
}

export interface ReviewCounts {
  ai_detected: number;
  ai_rejected: number;
  manual_added: number;
  final: number;
}

export interface ReviewedCollection {
  type: 'FeatureCollection';
  metadata: {
    version: 1;
    intervention_uid: string;
    intervention_hid?: string;
    project_uid?: string;
    counts: ReviewCounts;
    reviewed: boolean;
    reviewed_at: string;
    reviewed_by?: { id?: string | number; name?: string };
    analysis: {
      job_id: string;
      api_url: string;
      model: string;
      min_score: number;
      summary: AnalysisSummary;
      warnings: string[];
    };
    imagery: CaptureInfo;
  };
  features: {
    type: 'Feature';
    id: string;
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      source: PointSource;
      status: PointStatus;
      score: number | null;
      crown_diameter_m: number | null;
      ai_id: number | null;
    };
  }[];
}

// ---------------------------------------------------------------------------

export const countPoints = (points: ReviewPoint[]): ReviewCounts => {
  const ai = points.filter(p => p.source === 'ai');
  const rejected = ai.filter(p => p.status === 'rejected').length;
  const manual = points.filter(p => p.source === 'manual' && p.status === 'confirmed').length;
  return { ai_detected: ai.length, ai_rejected: rejected, manual_added: manual, final: ai.length - rejected + manual };
};

export const pointsFromResult = (result: AnalysisResult): ReviewPoint[] =>
  result.features
    .filter(f => f.geometry?.type === 'Point')
    .map(f => ({
      key: `ai-${f.properties.id}`,
      lon: f.geometry!.coordinates[0],
      lat: f.geometry!.coordinates[1],
      source: 'ai' as const,
      status: 'confirmed' as const,
      score: f.properties.score,
      crownDiameterM: f.properties.crown_diameter_m,
      aiId: f.properties.id,
    }));

export const pointsFromReview = (fc: ReviewedCollection): ReviewPoint[] =>
  fc.features.map(f => ({
    key: f.id,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    source: f.properties.source,
    status: f.properties.status,
    score: f.properties.score ?? undefined,
    crownDiameterM: f.properties.crown_diameter_m ?? undefined,
    aiId: f.properties.ai_id ?? undefined,
  }));

export function buildReviewedCollection(args: {
  points: ReviewPoint[];
  interventionUid: string;
  interventionHid?: string;
  projectUid?: string;
  job: PendingJob;
  result: Pick<AnalysisResult, 'summary' | 'warnings'>;
  reviewer?: { id?: string | number; name?: string };
}): ReviewedCollection {
  const { points, job, result } = args;
  return {
    type: 'FeatureCollection',
    metadata: {
      version: 1,
      intervention_uid: args.interventionUid,
      intervention_hid: args.interventionHid,
      project_uid: args.projectUid,
      counts: countPoints(points),
      reviewed: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: args.reviewer,
      analysis: {
        job_id: job.jobId,
        api_url: job.apiUrl,
        model: result.summary.model,
        min_score: job.minScore,
        summary: result.summary,
        warnings: result.warnings,
      },
      imagery: job.capture,
    },
    features: points.map(p => ({
      type: 'Feature',
      id: p.key,
      geometry: { type: 'Point', coordinates: [round7(p.lon), round7(p.lat)] },
      properties: {
        source: p.source,
        status: p.status,
        score: p.score ?? null,
        crown_diameter_m: p.crownDiameterM ?? null,
        ai_id: p.aiId ?? null,
      },
    })),
  };
}

const round7 = (v: number) => Math.round(v * 1e7) / 1e7;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const JOB_KEY = (uid: string) => `treemapper:satellite-count:job:${uid}`;
const REVIEW_KEY = (uid: string) => `treemapper:satellite-count:review:${uid}`;
export const CHANGE_EVENT = 'treemapper:satellite-count-changed';

const read = <T,>(key: string): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown, uid: string) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Could not store satellite count', err);
    throw new Error('Could not save in this browser (storage is full or blocked).');
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { uid } }));
};

export const loadPendingJob = (uid: string) => read<PendingJob>(JOB_KEY(uid));
export const savePendingJob = (uid: string, job: PendingJob) => write(JOB_KEY(uid), job, uid);
export const clearPendingJob = (uid: string) => write(JOB_KEY(uid), null, uid);

export const loadReview = (uid: string) => read<ReviewedCollection>(REVIEW_KEY(uid));

/** Store the reviewed count. Swap the body for an API call when available. */
export async function persistReview(uid: string, fc: ReviewedCollection): Promise<void> {
  write(REVIEW_KEY(uid), fc, uid);
}

export const clearReview = (uid: string) => write(REVIEW_KEY(uid), null, uid);

export function downloadGeoJSON(fc: ReviewedCollection, filename: string) {
  const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
