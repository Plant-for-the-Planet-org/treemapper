// Data fetching for the overview map.
import { getAllMapInterevntions, getProjectSitesMap } from '@shared-core/fetchApi/api.fetch';
import { baseUrl } from '@shared-core/fetchApi/api.url';
import { validateGeoJSONGeometry, calculateBounds } from './utils';
import type {
    ApiResponse,
    InterventionDetailResponse,
    MapIntervention,
    MapTree,
    ProjectMapResponse,
    SiteFeature,
    SiteFeatureCollection,
    TreeRecord,
} from './types';

export const fetchProjectInterventions = async (projectId: string, token: string): Promise<ApiResponse<ProjectMapResponse>> => {
    const response = await getAllMapInterevntions(token, projectId);
    const apiData = response.data?.data || response.data;
    const rawInterventions = apiData?.interventions || [];
    const apiBounds = apiData?.bounds;

    const processed = rawInterventions.map((i: any) => ({
        ...i,
        locationGeometryType: i.locationGeometryType || i.location?.type || 'Point',
    }));

    const valid = processed.filter((i: MapIntervention) => validateGeoJSONGeometry(i.location));
    const dropped = processed.length - valid.length;
    if (dropped > 0) {
        console.warn(`${dropped} interventions skipped due to invalid geometry`);
    }

    const bounds = apiBounds?.bounds && apiBounds?.center
        ? apiBounds
        : calculateBounds(valid);

    return {
        success: true,
        data: {
            interventions: valid,
            bounds,
            totalInterventions: valid.length,
        },
    };
};

export const fetchProjectSites = async (projectId: string, token: string): Promise<SiteFeatureCollection> => {
    const response = await getProjectSitesMap(token, projectId);
    // Endpoint returns { success, data: { type, features, totalSites } }.
    const apiData = response.data?.data || response.data;
    const features: SiteFeature[] = (apiData?.features || []).filter(
        (f: SiteFeature) => validateGeoJSONGeometry(f.geometry),
    );
    return { type: 'FeatureCollection', features, totalSites: features.length };
};

// Responses are double-wrapped: a global interceptor adds an outer
// { statusCode, message, data, code } envelope around the controller's own
// { success, statusCode, data } envelope, so the real payload sits at
// json.data.data. Peel both layers (and tolerate single- or no-wrap shapes).
const unwrapApi = (json: any): any => json?.data?.data ?? json?.data ?? json;

// Fetch full detail for a single tree. The bulk map/tree list only carries a
// photo when tree.image is set, which is often empty; this endpoint resolves
// the best available image (tree photo, then primary image, then latest record
// photo) plus tag and species. Called lazily when a tree marker is clicked.
export const fetchTreeDetail = async (
    treeHid: string,
    projectId: string,
    token?: string,
): Promise<Partial<MapTree> | null> => {
    const url = `${baseUrl}/interventions/trees/${treeHid}/${projectId}/detail`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return unwrapApi(data) as Partial<MapTree> | null;
};

// Fetch the remeasurement / status-change records for a tree. Records are the
// history rows (height, width, status change, notes) captured after planting.
// Called lazily when a tree detail panel opens.
export const fetchTreeRecords = async (
    treeHid: string,
    projectId: string,
    token?: string,
): Promise<TreeRecord[]> => {
    const url = `${baseUrl}/interventions/trees/${treeHid}/${projectId}/records`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    const payload = unwrapApi(data);
    return Array.isArray(payload?.records) ? (payload.records as TreeRecord[]) : [];
};

// Fetch the full detail for an intervention: the intervention itself (with
// owner + resolved photo) plus every tree in it (each with owner, latest
// measurements, species and photo) and the map bounds for plotting markers.
// Fired on every intervention select so the panel always shows fresh data.
export const fetchInterventionDetail = async (
    interventionId: number,
    projectId: string,
    token?: string,
): Promise<InterventionDetailResponse | null> => {
    const url = `${baseUrl}/interventions/${projectId}/intervention/${interventionId}/detail`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return unwrapApi(data) as InterventionDetailResponse | null;
};
