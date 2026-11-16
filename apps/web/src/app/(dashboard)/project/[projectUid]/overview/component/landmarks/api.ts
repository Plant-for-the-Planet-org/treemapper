// Landmark CRUD against the project-scoped landmarks API.
// Same direct-fetch conventions as ../map/api.ts (baseUrl + bearer + envelope unwrap).
import { baseUrl } from '@shared-core/fetchApi/api.url';
import type { LandmarkType } from './config';

export interface Landmark {
    uid: string;
    type: LandmarkType;
    name: string;
    description: string | null;
    otherLabel: string | null;
    location: GeoJSON.Point;
    image: string | null;
    isPrivate: boolean;
    siteUid: string | null;
    siteName: string | null;
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LandmarkInput {
    name: string;
    type: LandmarkType;
    description?: string;
    otherLabel?: string;
    latitude: number;
    longitude: number;
    isPrivate?: boolean;
}

// Every response sits in the global { statusCode, message, data } envelope;
// failures carry the real HTTP code plus a message (string or array).
async function request<T>(url: string, token?: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init?.body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { ...init, headers });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
        const message = json?.message ?? `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(Array.isArray(message) ? message.join(', ') : String(message));
    }
    return (json?.data?.data ?? json?.data ?? json) as T;
}

const landmarksUrl = (projectUid: string) => `${baseUrl}/projects/${projectUid}/landmarks`;

export const fetchProjectLandmarks = (projectUid: string, token?: string): Promise<Landmark[]> =>
    request<Landmark[]>(landmarksUrl(projectUid), token);

export const createLandmark = (projectUid: string, input: LandmarkInput, token?: string): Promise<Landmark> =>
    request<Landmark>(landmarksUrl(projectUid), token, {
        method: 'POST',
        body: JSON.stringify(input),
    });

export const updateLandmark = (
    projectUid: string,
    landmarkUid: string,
    input: Partial<LandmarkInput>,
    token?: string,
): Promise<Landmark> =>
    request<Landmark>(`${landmarksUrl(projectUid)}/${landmarkUid}`, token, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });

export const deleteLandmark = (projectUid: string, landmarkUid: string, token?: string): Promise<void> =>
    request<unknown>(`${landmarksUrl(projectUid)}/${landmarkUid}`, token, { method: 'DELETE' }).then(() => undefined);
