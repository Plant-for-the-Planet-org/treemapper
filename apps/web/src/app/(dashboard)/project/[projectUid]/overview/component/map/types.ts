// Shared types for the project overview map.

export interface MapIntervention {
    id: number;
    uid: string;
    hid: string;
    type: string;
    status: string;
    captureStatus?: string;
    registrationDate: string;
    interventionStartDate: string;
    interventionEndDate: string;
    location: GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon;
    locationGeometryType?: 'Point' | 'Polygon' | 'MultiPolygon';
    centroid?: GeoJSON.Point;
    area?: number;
    totalTreeCount: number;
    totalSampleTreeCount: number;
    description?: string;
    image?: string;
    owner?: { displayName: string | null; image: string | null } | null;
}

export interface MapTree {
    id: number;
    uid: string;
    hid: string;
    tag?: string;
    treeType: string;
    location: GeoJSON.Point;
    status: string;
    speciesName?: string;
    commonName?: string;
    speciesImage?: string;
    speciesFamily?: string;
    height?: number;
    width?: number;
    currentHealthScore?: number;
    plantingDate?: string;
    lastMeasurementDate?: string;
    image?: string;
    migratedTree?: boolean;
    ownerName?: string | null;
    ownerImage?: string | null;
}

// A single remeasurement / status-change record for a tree.
export interface TreeRecord {
    id: number;
    uid: string;
    recordType?: string;
    recordedAt?: string;
    previousStatus?: string | null;
    newStatus?: string | null;
    statusReason?: string | null;
    height?: number | null;
    width?: number | null;
    notes?: string | null;
    image?: string | null;
    recordedByName?: string | null;
}

export interface SiteFeature {
    type: 'Feature';
    id: number;
    properties: {
        id: number;
        uid: string;
        name: string;
        status?: string;
        area?: number | null;
        centroid?: GeoJSON.Point;
    };
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface SiteFeatureCollection {
    type: 'FeatureCollection';
    features: SiteFeature[];
    totalSites?: number;
}

export interface ProjectMapBounds {
    bounds: [number, number, number, number];
    center: [number, number];
}

export interface ProjectMapResponse {
    interventions: MapIntervention[];
    bounds: ProjectMapBounds;
    totalInterventions: number;
}

export interface InterventionDetailResponse {
    intervention: MapIntervention;
    trees: MapTree[];
    bounds: ProjectMapBounds;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: any;
}

export interface MapState {
    selectedInterventionId: number | null;
    selectedTreeId: number | null;
    showTreeDetails: boolean;
}

export interface MapError {
    type: 'network' | 'api' | 'mapbox' | 'geometry' | 'permission' | 'unknown';
    message: string;
    details?: any;
    recoverable: boolean;
}
