/**
 * Client for the tree-count analysis backend (treemapper-analysis).
 * Base URL comes from NEXT_PUBLIC_TREE_ANALYSIS_API_URL.
 */
import type { BBox } from './mercator';

export const ANALYSIS_API_URL = (
  process.env.NEXT_PUBLIC_TREE_ANALYSIS_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export type JobState = 'queued' | 'running' | 'succeeded' | 'failed';

export interface AnalysisSummary {
  tree_count: number;
  georeferenced?: boolean;
  aoi_area_ha: number | null;
  analysed_area_ha?: number;
  trees_per_ha: number | null;
  mean_score: number | null;
  median_crown_diameter_m: number | null;
  canopy_cover_estimate: number;
  image: { width: number; height: number; crs: string | null; bounds: BBox | null };
  ground_resolution_m: number;
  model: string;
  resample_factor: number;
  tiles_processed: number;
  processing_seconds: number;
  [key: string]: unknown;
}

export interface AnalysisStatus {
  id: string;
  status: JobState;
  progress: number;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
  summary?: AnalysisSummary;
  warnings?: string[];
}

export interface DetectedTree {
  type: 'Feature';
  id: number;
  geometry: { type: 'Point'; coordinates: [number, number] } | null;
  properties: {
    id: number;
    score: number;
    crown_diameter_m: number;
    pixel_center: [number, number];
    pixel_bbox: [number, number, number, number];
    crown_bbox?: BBox;
  };
}

export interface AnalysisResult {
  type: 'FeatureCollection';
  summary: AnalysisSummary;
  warnings: string[];
  features: DetectedTree[];
}

export class AnalysisApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ANALYSIS_API_URL}${path}`, init);
  } catch {
    throw new AnalysisApiError(
      `Cannot reach the tree-count service at ${ANALYSIS_API_URL}. Is it running?`,
    );
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      const d = body?.detail;
      detail = typeof d === 'string' ? d : d?.message || JSON.stringify(d ?? body);
    } catch { /* keep statusText */ }
    throw new AnalysisApiError(detail || `Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

export interface SubmitParams {
  bounds: BBox;
  min_score?: number;
  detector?: string;
}

export function submitAnalysis(image: Blob, aoi: object, params: SubmitParams): Promise<AnalysisStatus> {
  const form = new FormData();
  form.append('image', image, 'capture.jpg');
  form.append('aoi', new Blob([JSON.stringify(aoi)], { type: 'application/geo+json' }), 'aoi.geojson');
  form.append('params', JSON.stringify({ crs: 'EPSG:3857', ...params }));
  return request<AnalysisStatus>('/v1/analyses', { method: 'POST', body: form });
}

export const getAnalysisStatus = (id: string) =>
  request<AnalysisStatus>(`/v1/analyses/${encodeURIComponent(id)}`);

export const getAnalysisResult = (id: string) =>
  request<AnalysisResult>(`/v1/analyses/${encodeURIComponent(id)}/result`);

export const overlayUrl = (id: string, mode: 'annotated' | 'transparent' = 'annotated') =>
  `${ANALYSIS_API_URL}/v1/analyses/${encodeURIComponent(id)}/overlay?mode=${mode}`;
