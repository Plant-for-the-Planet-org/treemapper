import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trees,
    Activity,
    Calendar,
    Ruler,
    Heart,
    AlertCircle,
    RefreshCw,
    Loader2,
    X,
    Search,
    Filter,
    Plus,
    Minus,
    Copy,
    Check,
    MapPin,
    User,
    History,
    ArrowRight,
    ChevronRight,
    Maximize2,
    Minimize2,
} from 'lucide-react';
import * as turf from '@turf/turf';
import { getAllMapInterevntions, getProjectSitesMap } from '@shared-core/fetchApi/api.fetch';
import { cdnUrl } from '@/lib/cdn';
import { baseUrl } from '@shared-core/fetchApi/api.url';
import usePolling from '@/hooks/usePolling';

// ==================== TYPES ====================
interface MapIntervention {
    id: number;
    uid: string;
    hid: string;
    type: string;
    status: string;
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

interface MapTree {
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
interface TreeRecord {
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

interface SiteFeature {
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

interface SiteFeatureCollection {
    type: 'FeatureCollection';
    features: SiteFeature[];
    totalSites?: number;
}

interface ProjectMapBounds {
    bounds: [number, number, number, number];
    center: [number, number];
}

interface ProjectMapResponse {
    interventions: MapIntervention[];
    bounds: ProjectMapBounds;
    totalInterventions: number;
}

interface InterventionDetailResponse {
    intervention: MapIntervention;
    trees: MapTree[];
    bounds: ProjectMapBounds;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: any;
}

interface MapState {
    selectedInterventionId: number | null;
    selectedTreeId: number | null;
    showTreeDetails: boolean;
}

interface MapError {
    type: 'network' | 'api' | 'mapbox' | 'geometry' | 'permission' | 'unknown';
    message: string;
    details?: any;
    recoverable: boolean;
}

// ==================== UTILITY FUNCTIONS ====================
const validateGeoJSONGeometry = (geometry: any): boolean => {
    try {
        if (!geometry || !geometry.type || !geometry.coordinates) return false;
        switch (geometry.type) {
            case 'Point':
                return (
                    Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length >= 2 &&
                    typeof geometry.coordinates[0] === 'number' &&
                    typeof geometry.coordinates[1] === 'number' &&
                    isFinite(geometry.coordinates[0]) &&
                    isFinite(geometry.coordinates[1]) &&
                    Math.abs(geometry.coordinates[0]) <= 180 &&
                    Math.abs(geometry.coordinates[1]) <= 90
                );
            case 'Polygon':
                return (
                    Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length > 0 &&
                    Array.isArray(geometry.coordinates[0]) &&
                    geometry.coordinates[0].length >= 3
                );
            case 'MultiPolygon':
                return (
                    Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length > 0
                );
            default:
                return false;
        }
    } catch {
        return false;
    }
};

const BRAND = '#007A49';
const FILL_COLOR = '#007A49';
// Borders for the point/polygon intervention layers — a darker shade of the
// fill color, so edges stay defined without the harsh white outline.
const BORDER_COLOR = '#004D30';
// Site boundary outline — white reads clearly over the satellite base map.
const SITE_BOUNDARY_COLOR = '#ffffff';

// Static map style and props. These MUST be module-level constants (stable
// references). react-map-gl compares `mapStyle` / `interactiveLayerIds` by
// reference and re-applies the style (reloading every raster tile) whenever the
// reference changes. Inlining them as object/array literals recreated them on
// every render, so any state change (e.g. selecting an intervention) reloaded
// the whole map and produced a visible flicker.
const MAP_STYLE = {
    version: 8 as const,
    name: 'Satellite',
    bearing: 0,
    pitch: 0,
    sources: {
        imagery: {
            type: 'raster' as const,
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 18,
        },
    },
    layers: [
        {
            id: 'imagery',
            type: 'raster' as const,
            source: 'imagery',
            minzoom: 0,
            layout: { visibility: 'visible' as const },
        },
    ],
};

const INTERACTIVE_LAYER_IDS = [
    'interventions-polygons-fill',
    'interventions-polygons-outline',
    'interventions-points-clusters',
    'interventions-points-circle',
    'interventions-centroids-circle',
];

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const getInterventionColor = (type: string): string => {
    const colors: Record<string, string> = {
        'single-tree-registration': BRAND,
        'multi-tree-registration': BRAND,
        'direct-seeding': '#005c37',
        'enrichment-planting': '#009a5c',
        'maintenance': '#00b36b',
        'monitoring': '#004d30',
        'removal-invasive-species': '#c53030',
    };
    return colors[type] ?? BRAND;
};

const getTreeStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        alive: '#10b981',
        dead: '#dc2626',
        sick: '#f59e0b',
        unknown: '#6b7280',
        removed: '#374151',
    };
    return colors[status] ?? '#6b7280';
};

const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid date';
    }
};

// Resolve the stored tree image key into a full CDN URL. Mirrors the logic in
// TreeCard: migrated trees keep their legacy coordinate path, everything else
// lives under the project CDN's `tree/` folder. A value that is already a full
// URL is passed through untouched.
const buildTreeImageUrl = (tree: MapTree): string | null => {
    if (!tree.image) return null;
    if (/^https?:\/\//i.test(tree.image)) return tree.image;
    if (tree.migratedTree && /\.(jpe?g|png)$/i.test(tree.image)) {
        return `https://cdn.plant-for-the-planet.org/media/cache/coordinate/large/${tree.image}`;
    }
    return cdnUrl('tree', tree.image);
};

// Scientific species reference image lives under the CDN's `species/` folder.
const buildSpeciesImageUrl = (image?: string): string | null => {
    return cdnUrl('species', image);
};

const formatHeight = (v?: number | null): string | null =>
    v == null ? null : `${v} m`;

const formatWidth = (v?: number | null): string | null =>
    v == null ? null : `${v} cm`;

// Format an area in m² into a human-readable label.
// >= 10,000 m² (1 ha) → show in hectares; otherwise m².
const formatArea = (sqm: number): string =>
    sqm >= 10_000
        ? `${(sqm / 10_000).toFixed(2)} ha`
        : `${sqm.toFixed(2)} m²`;

// Resolve the display area for an intervention. Prefers the stored value;
// falls back to computing from the polygon geometry when it is missing.
const resolveArea = (intervention: MapIntervention): string => {
    if (intervention.area) return formatArea(intervention.area);
    if (
        intervention.location.type === 'Polygon' ||
        intervention.location.type === 'MultiPolygon'
    ) {
        try {
            const sqm = turf.area(intervention.location as any);
            if (sqm > 0) return formatArea(sqm);
        } catch { /* ignore */ }
    }
    return '—';
};

// First-letter initials for an avatar fallback when no photo is available.
const initialsOf = (name?: string | null): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

const getMarkerPosition = (intervention: MapIntervention): [number, number] => {
    try {
        if (intervention.location.type === 'Point') {
            return intervention.location.coordinates as [number, number];
        }
        if (intervention.centroid) {
            return intervention.centroid.coordinates as [number, number];
        }
        const centroid = turf.centroid(intervention.location as any);
        return centroid.geometry.coordinates as [number, number];
    } catch {
        return [0, 0];
    }
};

const zoomToIntervention = (intervention: MapIntervention, mapRef: any) => {
    if (!mapRef) return;
    try {
        if (intervention.location.type === 'Polygon' || intervention.location.type === 'MultiPolygon') {
            const [minLng, minLat, maxLng, maxLat] = turf.bbox(intervention.location as any);
            mapRef.fitBounds([minLng, minLat, maxLng, maxLat], {
                padding: { top: 80, bottom: 80, left: 320, right: 80 },
                duration: 1000,
                maxZoom: 18,
            });
        } else {
            const [lng, lat] = getMarkerPosition(intervention);
            if (isFinite(lng) && isFinite(lat)) {
                mapRef.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
            }
        }
    } catch { /* ignore */ }
};

const calculateBounds = (interventions: MapIntervention[]): ProjectMapBounds => {
    try {
        if (interventions.length === 0) {
            return { bounds: [-180, -85, 180, 85], center: [0, 0] };
        }
        const allCoords: number[][] = [];
        interventions.forEach(i => {
            if (i.location.type === 'Point') {
                allCoords.push(i.location.coordinates as number[]);
            } else {
                try {
                    const c = turf.centroid(i.location as any);
                    allCoords.push(c.geometry.coordinates);
                } catch { /* skip */ }
            }
        });
        if (allCoords.length === 0) return { bounds: [-180, -85, 180, 85], center: [0, 0] };

        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const lngPad = (maxLng - minLng) * 0.1 || 0.01;
        const latPad = (maxLat - minLat) * 0.1 || 0.01;

        return {
            bounds: [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad],
            center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        };
    } catch {
        return { bounds: [-180, -85, 180, 85], center: [0, 0] };
    }
};

// ==================== API FUNCTIONS ====================
const fetchProjectInterventions = async (projectId: string, token: string): Promise<ApiResponse<ProjectMapResponse>> => {
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

const fetchProjectSites = async (projectId: string, token: string): Promise<SiteFeatureCollection> => {
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
const fetchTreeDetail = async (
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
const fetchTreeRecords = async (
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
const fetchInterventionDetail = async (
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

// ==================== COMPONENTS ====================

const InterventionSidebar: React.FC<{
    interventions: MapIntervention[];
    selectedId: number | null;
    onSelect: (intervention: MapIntervention) => void;
    hidSearch: string;
    onHidSearch: (v: string) => void;
    types: string[];
    statuses: string[];
    activeTypes: Set<string>;
    activeStatuses: Set<string>;
    onToggleType: (t: string) => void;
    onToggleStatus: (s: string) => void;
    total: number;
    sites: SiteFeature[];
    selectedSiteId: number | null;
    onSelectSite: (id: number | null) => void;
}> = ({ interventions, selectedId, onSelect, hidSearch, onHidSearch, types, statuses, activeTypes, activeStatuses, onToggleType, onToggleStatus, total, sites, selectedSiteId, onSelectSite }) => {
    const [filterOpen, setFilterOpen] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const allTypesActive = types.every(t => activeTypes.has(t));
    const allStatusesActive = statuses.every(s => activeStatuses.has(s));
    const hasFilter = hidSearch || !allTypesActive || !allStatusesActive;

    useEffect(() => {
        if (selectedId == null) return;
        const el = listRef.current?.querySelector(`[data-id="${selectedId}"]`);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedId]);

    return (
        <div className="absolute top-4 left-4 bottom-20 z-40 w-72 flex flex-col bg-white border border-gray-100" style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)' }}>
            {/* Header: site selector + search + filter */}
            <div className="shrink-0 border-b border-gray-100">
                {sites.length > 0 && (
                    <div className="flex items-center gap-2 px-3 pt-3 pb-1 border-b border-gray-100">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <select
                            value={selectedSiteId ?? ''}
                            onChange={e => onSelectSite(e.target.value ? Number(e.target.value) : null)}
                            className="flex-1 text-sm outline-none bg-transparent text-gray-700 cursor-pointer truncate"
                        >
                            <option value="">All sites</option>
                            {sites.map(s => (
                                <option key={s.id} value={s.id}>{s.properties.name}</option>
                            ))}
                        </select>
                        {selectedSiteId != null && (
                            <button onClick={() => onSelectSite(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        value={hidSearch}
                        onChange={e => onHidSearch(e.target.value)}
                        placeholder="Search by HID..."
                        className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                    {hidSearch && (
                        <button onClick={() => onHidSearch('')} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => setFilterOpen(o => !o)}
                        className="p-1 rounded transition-colors"
                        style={{ color: filterOpen || hasFilter ? '#007A49' : undefined }}
                    >
                        <Filter className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="px-3 pb-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {interventions.length === total
                            ? `${total} interventions`
                            : `${interventions.length} of ${total} shown`}
                    </span>
                    {hasFilter && interventions.length < total && (
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">filtered</span>
                    )}
                </div>

                <AnimatePresence>
                    {filterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-100"
                        >
                            <div className="px-3 py-3 space-y-3">
                                {types.length > 0 && (
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 mb-1.5">Type</div>
                                        <div className="flex flex-wrap gap-1">
                                            {types.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => onToggleType(t)}
                                                    className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                                                    style={activeTypes.has(t) ? {
                                                        backgroundColor: 'rgba(0,122,73,0.08)',
                                                        borderColor: 'rgba(0,122,73,0.4)',
                                                        color: '#007A49',
                                                    } : undefined}
                                                >
                                                    {t.replace(/-/g, ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {statuses.length > 0 && (
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 mb-1.5">Status</div>
                                        <div className="flex flex-wrap gap-1">
                                            {statuses.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => onToggleStatus(s)}
                                                    className="text-xs px-2 py-0.5 rounded-full border transition-colors capitalize"
                                                    style={activeStatuses.has(s) ? {
                                                        backgroundColor: 'rgba(0,122,73,0.08)',
                                                        borderColor: 'rgba(0,122,73,0.4)',
                                                        color: '#007A49',
                                                    } : undefined}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scrollable intervention list */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {interventions.map(i => (
                    <button
                        key={i.id}
                        data-id={i.id}
                        onClick={() => onSelect(i)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border transition-all"
                        style={selectedId === i.id ? {
                            borderColor: 'rgba(0,122,73,0.35)',
                            backgroundColor: 'rgba(0,122,73,0.06)',
                        } : undefined}
                    >
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-mono text-xs font-semibold text-gray-800 truncate">{i.hid}</span>
                            <span
                                className="text-xs px-1.5 py-0.5 rounded-full shrink-0 capitalize leading-none"
                                style={i.status === 'complete' || i.status === 'completed' ? {
                                    backgroundColor: 'rgba(0,122,73,0.1)',
                                    color: '#007A49',
                                } : undefined}
                            >
                                {i.status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 capitalize mb-1">{i.type.replace(/-/g, ' ')}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{(i.totalTreeCount ?? 0).toLocaleString()} trees</span>
                            {(i.area || i.location.type === 'Polygon' || i.location.type === 'MultiPolygon') && (
                                <span>{resolveArea(i)}</span>
                            )}
                        </div>
                    </button>
                ))}
                {interventions.length === 0 && (
                    <div className="py-10 text-center text-xs text-gray-400">No interventions match filters</div>
                )}
            </div>
        </div>
    );
};

const ErrorDisplay: React.FC<{
    error: MapError;
    onRetry?: () => void;
    onDismiss?: () => void;
}> = ({ error, onRetry, onDismiss }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border border-red-200 max-w-md"
    >
        <div className="p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">Map Error</h3>
                    <p className="text-sm text-gray-600 mb-3">{error.message}</p>
                    {error.recoverable && onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                        </button>
                    )}
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

const LoadingDisplay: React.FC<{ message?: string }> = ({ message = 'Loading map...' }) => (
    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-40">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    </div>
);

const TreeMarker: React.FC<{
    tree: MapTree;
    isSelected: boolean;
    onClick: () => void;
}> = ({ tree, isSelected, onClick }) => {
    const color = getTreeStatusColor(tree.status);
    const [lng, lat] = tree.location.coordinates as [number, number];
    if (!isFinite(lng) || !isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;

    return (
        <Marker longitude={lng} latitude={lat} onClick={onClick} style={{ zIndex: isSelected ? 20 : 1 }}>
            <div className="relative flex items-center justify-center">
                {/* Highlight ring for the selected tree */}
                {isSelected && (
                    <>
                        <motion.span
                            className="absolute rounded-full"
                            style={{ border: `2px solid ${color}`, width: 38, height: 38 }}
                            initial={{ scale: 0.6, opacity: 0.8 }}
                            animate={{ scale: 1.4, opacity: 0 }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <span
                            className="absolute rounded-full"
                            style={{ backgroundColor: color, opacity: 0.18, width: 32, height: 32 }}
                        />
                    </>
                )}
                <Trees
                    size={isSelected ? 22 : 16}
                    color={isSelected ? '#ffffff' : color}
                    fill={color}
                    strokeWidth={isSelected ? 2.5 : 2}
                    className="relative cursor-pointer drop-shadow-sm transition-all"
                />
            </div>
        </Marker>
    );
};

// Small copy-to-clipboard button that briefly flips to a check on success.
const CopyButton: React.FC<{ value: string; title?: string; className?: string }> = ({ value, title = 'Copy', className }) => {
    const [copied, setCopied] = useState(false);
    const copy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard unavailable */ }
    };
    return (
        <button
            type="button"
            onClick={copy}
            title={copied ? 'Copied' : title}
            className={`inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${className ?? 'w-6 h-6'}`}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
};

// Avatar that shows the person's photo, falling back to their initials.
const OwnerAvatar: React.FC<{ name?: string | null; image?: string | null; size?: number }> = ({ name, image, size = 24 }) => {
    const [err, setErr] = useState(false);
    const px = { width: size, height: size };
    if (image && !err) {
        return (
            <img
                src={image}
                alt={name ?? 'owner'}
                referrerPolicy="no-referrer"
                onError={() => setErr(true)}
                className="rounded-full object-cover bg-gray-100 shrink-0"
                style={px}
            />
        );
    }
    return (
        <span
            className="rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-medium shrink-0"
            style={{ ...px, fontSize: Math.max(10, size * 0.42) }}
        >
            {initialsOf(name)}
        </span>
    );
};

// One tree in the panel's scrollable list. Shows the photo, identity, latest
// measurements, owner, and a copy-coordinates action. Clicking opens the tree.
const TreeListItem: React.FC<{ tree: MapTree; onSelect: (tree: MapTree) => void }> = ({ tree, onSelect }) => {
    const [imgErr, setImgErr] = useState(false);
    const photo = buildTreeImageUrl(tree);
    const statusColor = getTreeStatusColor(tree.status);
    const height = formatHeight(tree.height);
    const width = formatWidth(tree.width);
    const species = tree.speciesName || tree.commonName;
    const coords = tree.location?.type === 'Point'
        ? `${tree.location.coordinates[0]}, ${tree.location.coordinates[1]}`
        : '';

    return (
        <button
            type="button"
            onClick={() => onSelect(tree)}
            className="w-full text-left flex gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
        >
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {photo && !imgErr ? (
                    <img
                        src={photo}
                        alt={tree.tag || tree.hid}
                        loading="lazy"
                        onError={() => setImgErr(true)}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Trees className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                )}
                <span
                    className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: statusColor }}
                    title={tree.status}
                />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 truncate">
                        {tree.tag ? `Tag ${tree.tag}` : tree.hid}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize shrink-0">
                        {tree.status}
                    </span>
                </div>
                {species && (
                    <div className="text-xs text-gray-500 truncate italic">{species}</div>
                )}
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    {height && <span className="inline-flex items-center gap-0.5"><Ruler className="w-3 h-3" /> {height}</span>}
                    {width && <span>⌀ {width}</span>}
                    {!height && !width && <span className="text-gray-300">No measurements</span>}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                        <OwnerAvatar name={tree.ownerName} image={tree.ownerImage} size={18} />
                        <span className="text-[11px] text-gray-500 truncate">{tree.ownerName || 'Unknown'}</span>
                    </span>
                    {coords && <CopyButton value={JSON.stringify(tree.location)} title="Copy GeoJSON coordinates" />}
                </div>
            </div>
        </button>
    );
};

const InterventionPanel: React.FC<{
    intervention: MapIntervention;
    trees: MapTree[];
    isLoading?: boolean;
    onClose: () => void;
    onZoomTo?: (intervention: MapIntervention) => void;
    onSelectTree: (tree: MapTree) => void;
}> = ({ intervention, trees, isLoading = false, onClose, onZoomTo, onSelectTree }) => {
    const centroidCoords = useMemo(() => {
        try {
            let c: any;
            if (intervention.centroid) {
                c = intervention.centroid.coordinates;
            } else if (intervention.location.type === 'Point') {
                c = intervention.location.coordinates;
            } else {
                c = turf.centroid(intervention.location as any).geometry.coordinates;
            }
            return { lat: c[1].toFixed(5), lng: c[0].toFixed(5) };
        } catch {
            return null;
        }
    }, [intervention]);

    const isComplete = intervention.status === 'complete' || intervention.status === 'completed';

    return (
        <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            className="absolute top-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[88vh] flex flex-col overflow-hidden"
            style={{ width: 380 }}
        >
            {/* Header — no intervention photo; tree photos live in the list below */}
            <div className="shrink-0 px-4 py-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{intervention.hid}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                {intervention.type.replace(/-/g, ' ')}
                            </span>
                            <span
                                className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                                style={isComplete
                                    ? { backgroundColor: 'rgba(0,122,73,0.1)', color: BRAND }
                                    : { backgroundColor: '#f3f4f6', color: '#374151' }}
                            >
                                {intervention.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => onZoomTo?.(intervention)}
                            title="Zoom to intervention"
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
                        >
                            <MapPin className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            title="Close"
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
                {/* Owner */}
                {intervention.owner?.displayName && (
                    <div className="flex items-center gap-2 px-4 pt-3">
                        <OwnerAvatar name={intervention.owner.displayName} image={intervention.owner.image} size={26} />
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
                                <User className="w-3 h-3" /> Owner
                            </div>
                            <div className="text-sm text-gray-800 truncate">{intervention.owner.displayName}</div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 px-4 pt-3">
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Start date</div>
                        <div className="text-sm text-gray-800">{formatDate(intervention.interventionStartDate)}</div>
                    </div>
                    {(intervention.location.type === 'Polygon' || intervention.location.type === 'MultiPolygon') && (
                        <div>
                            <div className="text-xs text-gray-400 mb-0.5">Area</div>
                            <div className="text-sm text-gray-800">{resolveArea(intervention)}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Total trees</div>
                        <div className="text-sm font-medium text-gray-800">{intervention.totalTreeCount?.toLocaleString() ?? 0}</div>
                    </div>
                    {!!intervention.totalSampleTreeCount && (
                        <div>
                            <div className="text-xs text-gray-400 mb-0.5">Sample trees</div>
                            <div className="text-sm text-gray-800">{intervention.totalSampleTreeCount}</div>
                        </div>
                    )}
                </div>

                {/* Geo Coordinates with copy */}
                <div className="px-4 pt-3">
                    <div className="text-xs text-gray-400 mb-1">Geo Coordinates</div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-3 text-sm font-mono text-gray-700">
                            <span><span className="text-xs text-gray-400 mr-1">Lat</span>{centroidCoords?.lat ?? '—'}</span>
                            <span><span className="text-xs text-gray-400 mr-1">Lng</span>{centroidCoords?.lng ?? '—'}</span>
                        </div>
                        <CopyButton value={JSON.stringify(intervention.location)} title="Copy GeoJSON coordinates" />
                    </div>
                </div>

                {/* Description */}
                {intervention.description && (
                    <div className="px-4 pt-3">
                        <div className="text-xs text-gray-400 mb-0.5">Description</div>
                        <p className="text-sm text-gray-700">{intervention.description}</p>
                    </div>
                )}

                {/* Trees */}
                <div className="px-4 pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900">
                            Trees {!isLoading && <span className="text-gray-400 font-normal">({trees.length})</span>}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs mt-2">Loading details...</span>
                        </div>
                    ) : trees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                            <Trees className="w-8 h-8" strokeWidth={1.5} />
                            <span className="text-xs mt-1.5 text-gray-400">No trees recorded</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {trees.map(tree => (
                                <TreeListItem key={tree.id} tree={tree} onSelect={onSelectTree} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const DetailStat: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}> = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
        <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
        <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
            <div className="text-sm text-gray-800 truncate">{value}</div>
        </div>
    </div>
);

const RecordsPanel: React.FC<{
    records: TreeRecord[];
    isLoadingRecords: boolean;
    onClose: () => void;
}> = ({ records, isLoadingRecords, onClose }) => (
    <motion.div
        initial={{ scale: 0.95, opacity: 0, x: 8 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.95, opacity: 0, x: 8 }}
        className="absolute top-4 right-[calc(20rem+1.5rem)] w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-30 flex flex-col max-h-[calc(100vh-2rem)]"
    >
        <div className="px-4 pt-3.5 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <History className="w-4 h-4 text-gray-400" />
                Records
                {!isLoadingRecords && (
                    <span className="text-gray-400 font-normal">({records.length})</span>
                )}
            </div>
            <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
        <div
            className="overflow-y-auto flex-1 min-h-0 overscroll-contain px-4 py-3"
            onWheel={(e) => e.stopPropagation()}
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
            {isLoadingRecords ? (
                <div className="flex items-center gap-2 py-4 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    <span className="text-xs">Loading records...</span>
                </div>
            ) : records.length === 0 ? (
                <div className="py-3 text-xs text-gray-400">No records yet</div>
            ) : (
                <ol className="relative border-l border-gray-200 ml-1.5 space-y-3">
                    {records.map(rec => {
                        const recH = formatHeight(rec.height);
                        const recW = formatWidth(rec.width);
                        const statusChanged = rec.newStatus && rec.newStatus !== rec.previousStatus;
                        return (
                            <li key={rec.id} className="ml-4">
                                <span
                                    className="absolute -left-[5px] w-2.5 h-2.5 rounded-full ring-2 ring-white"
                                    style={{ backgroundColor: getTreeStatusColor(rec.newStatus || '') }}
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium text-gray-700 capitalize">
                                        {rec.recordType?.replace(/_/g, ' ') || 'Record'}
                                    </span>
                                    {rec.recordedAt && (
                                        <span className="text-[11px] text-gray-400">{formatDate(rec.recordedAt)}</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-gray-500">
                                    {recH && <span className="inline-flex items-center gap-0.5"><Ruler className="w-3 h-3" /> {recH}</span>}
                                    {recW && <span>⌀ {recW}</span>}
                                    {statusChanged && (
                                        <span className="inline-flex items-center gap-1 capitalize">
                                            {rec.previousStatus || '—'}
                                            <ArrowRight className="w-3 h-3" />
                                            {rec.newStatus}
                                        </span>
                                    )}
                                </div>
                                {rec.statusReason && (
                                    <div className="text-[11px] text-gray-400 mt-0.5">Reason: {rec.statusReason}</div>
                                )}
                                {rec.notes && (
                                    <div className="text-[11px] text-gray-500 mt-0.5">{rec.notes}</div>
                                )}
                                {rec.recordedByName && (
                                    <div className="text-[11px] text-gray-400 mt-0.5">by {rec.recordedByName}</div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    </motion.div>
);

const TreeTooltip: React.FC<{
    tree: MapTree;
    onClose: () => void;
    isLoadingDetail?: boolean;
    records?: TreeRecord[];
    isLoadingRecords?: boolean;
    onViewRecords?: () => void;
}> = ({ tree, onClose, isLoadingDetail = false, records = [], isLoadingRecords = false, onViewRecords }) => {
    const statusColor = getTreeStatusColor(tree.status);
    const treeImage = buildTreeImageUrl(tree);
    const speciesImage = buildSpeciesImageUrl(tree.speciesImage);
    const [treeImgError, setTreeImgError] = useState(false);
    const [speciesImgError, setSpeciesImgError] = useState(false);
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);

    const showTreeImage = treeImage && !treeImgError;
    const showSpeciesImage = speciesImage && !speciesImgError;

    useEffect(() => {
        if (!isImageFullscreen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsImageFullscreen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isImageFullscreen]);

    const height = formatHeight(tree.height);
    const width = formatWidth(tree.width);
    const coords = tree.location?.type === 'Point'
        ? `${tree.location.coordinates[1].toFixed(6)}, ${tree.location.coordinates[0].toFixed(6)}`
        : null;

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            className="absolute top-4 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-30 flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden"
        >
            {/* Image header / banner */}
            <div className="relative h-40 shrink-0 bg-gradient-to-br from-emerald-50 to-gray-100">
                {showTreeImage ? (
                    <button
                        type="button"
                        onClick={() => setIsImageFullscreen(true)}
                        className="group w-full h-full block cursor-zoom-in"
                        title="View full screen"
                    >
                        <img
                            src={treeImage as string}
                            alt={tree.tag || tree.hid}
                            className="w-full h-full object-cover"
                            onError={() => setTreeImgError(true)}
                        />
                        <span className="absolute bottom-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                    </button>
                ) : isLoadingDetail ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-7 h-7 animate-spin" strokeWidth={1.5} />
                        <span className="text-xs mt-1.5">Loading photo...</span>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <Trees className="w-10 h-10" strokeWidth={1.5} />
                        <span className="text-xs mt-1.5 text-gray-400">No tree photo</span>
                    </div>
                )}

                {/* Status badge */}
                <div
                    className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: statusColor }}
                >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                    {tree.status}
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-gray-500 hover:text-gray-800 hover:bg-white transition-colors backdrop-blur-sm"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div
                className="overflow-y-auto flex-1 min-h-0 overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
                {/* Title */}
                <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-900 leading-tight">{tree.tag || tree.hid}</div>
                    <div className="flex items-center gap-2 mt-1">
                        {tree.tag && <span className="font-mono text-xs text-gray-400">{tree.hid}</span>}
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">
                            {tree.treeType}
                        </span>
                    </div>
                </div>

                {/* Species */}
                {(tree.speciesName || tree.commonName) && (
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-emerald-50 flex items-center justify-center">
                            {showSpeciesImage ? (
                                <img
                                    src={speciesImage as string}
                                    alt={tree.speciesName || ''}
                                    className="w-full h-full object-cover"
                                    onError={() => setSpeciesImgError(true)}
                                />
                            ) : (
                                <Trees className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="min-w-0">
                            {tree.speciesName && (
                                <div className="text-sm font-medium italic text-gray-800 truncate">{tree.speciesName}</div>
                            )}
                            {tree.commonName && (
                                <div className="text-xs text-gray-500 truncate">{tree.commonName}</div>
                            )}
                            {tree.speciesFamily && (
                                <div className="text-[11px] text-gray-400 truncate">{tree.speciesFamily}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Details grid */}
                <div className="px-4 py-3.5 grid grid-cols-2 gap-x-4 gap-y-3.5">
                    {height && (
                        <DetailStat icon={<Ruler className="w-4 h-4" />} label="Height" value={height} />
                    )}
                    {width && (
                        <DetailStat icon={<Ruler className="w-4 h-4 rotate-90" />} label="Diameter" value={width} />
                    )}
                    {tree.currentHealthScore != null && (
                        <DetailStat
                            icon={<Heart className="w-4 h-4" />}
                            label="Health"
                            value={`${tree.currentHealthScore}/100`}
                        />
                    )}
                    {tree.plantingDate && (
                        <DetailStat
                            icon={<Calendar className="w-4 h-4" />}
                            label="Planted"
                            value={formatDate(tree.plantingDate)}
                        />
                    )}
                    {tree.lastMeasurementDate && (
                        <DetailStat
                            icon={<Activity className="w-4 h-4" />}
                            label="Last measured"
                            value={formatDate(tree.lastMeasurementDate)}
                        />
                    )}
                </div>

                {/* Owner + coordinates */}
                <div className="px-4 pb-3.5 space-y-3">
                    {tree.ownerName && (
                        <div className="flex items-center gap-2">
                            <OwnerAvatar name={tree.ownerName} image={tree.ownerImage} size={26} />
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Owner
                                </div>
                                <div className="text-sm text-gray-800 truncate">{tree.ownerName}</div>
                            </div>
                        </div>
                    )}
                    {coords && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-1 mb-0.5">
                                <MapPin className="w-3 h-3" /> Coordinates
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-700 truncate">{coords}</span>
                                <CopyButton value={coords} title="Copy coordinates" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Records CTA */}
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    {isLoadingRecords ? (
                        <div className="flex items-center gap-2 py-2 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs">Loading records...</span>
                        </div>
                    ) : (
                        <button
                            onClick={onViewRecords}
                            disabled={records.length === 0 || !onViewRecords}
                            className="w-full flex items-center justify-between group py-1 disabled:opacity-40 disabled:cursor-default"
                        >
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                <History className="w-4 h-4 text-gray-400" />
                                Records
                                <span className="text-gray-400 font-normal">({records.length})</span>
                            </div>
                            {records.length > 0 && (
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Fullscreen image viewer — portaled to <body> so it sits above
                every mounted screen, free of the tooltip's transformed parent. */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isImageFullscreen && showTreeImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsImageFullscreen(false)}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out p-6"
                        >
                            <button
                                type="button"
                                onClick={() => setIsImageFullscreen(false)}
                                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <img
                                src={treeImage as string}
                                alt={tree.tag || tree.hid}
                                onClick={(e) => e.stopPropagation()}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};

const MapLegend: React.FC = () => (
     null
);

// All site + intervention map layers. Their paint/layout is fully static:
// selection and hover are conveyed through feature-state (set imperatively on
// the map), NOT through React state, so these layers never need to change when
// the user selects an intervention. Wrapping them in React.memo keeps the
// rendered <Source>/<Layer> elements referentially identical across selection
// re-renders, so react-map-gl skips all reconciliation for them. This is what
// stops the shapes/markers from blinking (flickering) on every select. The
// props only change on a data refresh (poll) or a sites/visibility toggle.
const StaticMapLayers: React.FC<{
    showSiteBoundaries: boolean;
    sites: SiteFeatureCollection;
    polygonGeoJSON: GeoJSON.FeatureCollection;
    centroidGeoJSON: GeoJSON.FeatureCollection;
    pointGeoJSON: GeoJSON.FeatureCollection;
    mapLoaded: boolean;
}> = React.memo(({ showSiteBoundaries, sites, polygonGeoJSON, centroidGeoJSON, pointGeoJSON, mapLoaded }) => (
    <>
        {/* Site boundaries — rendered first so they sit under the interventions */}
        {showSiteBoundaries && sites.features.length > 0 && (
            <Source id="site-boundaries" type="geojson" data={sites}>
                {/* Outline */}
                <Layer
                    id="site-boundaries-outline"
                    type="line"
                    paint={{
                        'line-color': SITE_BOUNDARY_COLOR,
                        'line-width': 2,
                        'line-opacity': 0.9,
                        'line-dasharray': [2, 1.5],
                    }}
                />
                {/* Site name label at the polygon centroid */}
                <Layer
                    id="site-boundaries-label"
                    type="symbol"
                    layout={{
                        'text-field': ['get', 'name'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                        'text-anchor': 'center',
                        'text-allow-overlap': false,
                        'symbol-placement': 'point',
                    }}
                    paint={{
                        'text-color': SITE_BOUNDARY_COLOR,
                        'text-halo-color': 'rgba(0,0,0,0.65)',
                        'text-halo-width': 1.5,
                    }}
                />
            </Source>
        )}

        {/* Polygon fills — visible from zoom 9 */}
        {polygonGeoJSON.features.length > 0 && (
            <Source id="interventions-polygons" type="geojson" data={polygonGeoJSON}>
                {/* Outer glow — only on hover/select */}
                <Layer
                    id="interventions-polygons-glow"
                    type="line"
                    minzoom={9}
                    paint={{
                        'line-color': BORDER_COLOR,
                        'line-width': 10,
                        'line-blur': 6,
                        'line-opacity': [
                            'case',
                            ['feature-state', 'selected'], 0.30,
                            ['feature-state', 'hover'], 0.45,
                            0,
                        ],
                    }}
                />
                {/* Semi-transparent fill. Default sits lower so the hovered
                    polygon clearly brightens under the cursor. */}
                <Layer
                    id="interventions-polygons-fill"
                    type="fill"
                    minzoom={9}
                    paint={{
                        'fill-color': FILL_COLOR,
                        'fill-opacity': [
                            'case',
                            ['feature-state', 'selected'], 0.80,
                            ['feature-state', 'hover'], 0.85,
                            0.45,
                        ],
                        'fill-opacity-transition': { duration: 150 },
                    }}
                />
                {/* Dark-green border */}
                <Layer
                    id="interventions-polygons-outline"
                    type="line"
                    minzoom={9}
                    paint={{
                        'line-color': BORDER_COLOR,
                        'line-width': [
                            'case',
                            ['feature-state', 'selected'], 5,
                            ['feature-state', 'hover'], 4.5,
                            4,
                        ],
                        'line-opacity': [
                            'case',
                            ['feature-state', 'selected'], 1,
                            ['feature-state', 'hover'], 0.95,
                            0.85,
                        ],
                    }}
                />
            </Source>
        )}

        {/* Centroid dots for polygon interventions at low zoom */}
        {centroidGeoJSON.features.length > 0 && (
            <Source id="interventions-centroids" type="geojson" data={centroidGeoJSON}>
                <Layer
                    id="interventions-centroids-circle"
                    type="circle"
                    maxzoom={9}
                    paint={{
                        'circle-color': FILL_COLOR,
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            0, 5, 6, 8, 9, 12,
                        ],
                        'circle-opacity': ['case', ['feature-state', 'hover'], 1, 0.88],
                        'circle-stroke-width': 2.5,
                        'circle-stroke-color': BORDER_COLOR,
                    }}
                />
            </Source>
        )}

        {/* Point interventions with clustering */}
        {pointGeoJSON.features.length > 0 && (
            <Source
                id="interventions-points"
                type="geojson"
                data={pointGeoJSON}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
                clusterProperties={{ totalTreeCount: ['+', ['get', 'totalTreeCount']] }}
            >
                {/* Cluster bubble */}
                <Layer
                    id="interventions-points-clusters"
                    type="circle"
                    filter={['has', 'point_count']}
                    paint={{
                        'circle-color': FILL_COLOR,
                        'circle-radius': [
                            'step', ['get', 'point_count'],
                            22, 5, 30, 20, 38,
                        ],
                        'circle-opacity': 0.92,
                        'circle-stroke-width': 3,
                        'circle-stroke-color': BORDER_COLOR,
                    }}
                />
                {/* Cluster: tree icon + total tree count */}
                {mapLoaded && (
                    <Layer
                        id="interventions-points-cluster-label"
                        type="symbol"
                        filter={['has', 'point_count']}
                        layout={{
                            'icon-image': 'tree-icon',
                            'icon-size': 0.75,
                            'icon-anchor': 'bottom',
                            'icon-offset': [0, 2],
                            'icon-allow-overlap': true,
                            'text-field': [
                                'case',
                                ['>', ['get', 'totalTreeCount'], 0],
                                ['to-string', ['get', 'totalTreeCount']],
                                ['to-string', ['get', 'point_count']],
                            ],
                            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                            'text-size': 11,
                            'text-anchor': 'top',
                            'text-offset': [0, -0.2],
                            'text-allow-overlap': true,
                        }}
                        paint={{ 'text-color': '#ffffff' }}
                    />
                )}
                {/* Individual unclustered point — circle background */}
                <Layer
                    id="interventions-points-circle"
                    type="circle"
                    filter={['!', ['has', 'point_count']]}
                    paint={{
                        'circle-color': FILL_COLOR,
                        'circle-radius': [
                            'case',
                            ['feature-state', 'selected'], 18,
                            ['feature-state', 'hover'], 16,
                            14,
                        ],
                        'circle-stroke-width': [
                            'case',
                            ['feature-state', 'selected'], 3.5,
                            ['feature-state', 'hover'], 2.5,
                            2,
                        ],
                        'circle-stroke-color': BORDER_COLOR,
                        'circle-opacity': [
                            'case',
                            ['feature-state', 'selected'], 1,
                            ['feature-state', 'hover'], 0.95,
                            0.90,
                        ],
                    }}
                />
                {/* Individual unclustered point — tree icon overlay */}
                {mapLoaded && (
                    <Layer
                        id="interventions-points-icon"
                        type="symbol"
                        filter={['!', ['has', 'point_count']]}
                        layout={{
                            'icon-image': 'tree-icon',
                            'icon-size': 0.65,
                            'icon-allow-overlap': true,
                        }}
                    />
                )}
            </Source>
        )}
    </>
));
StaticMapLayers.displayName = 'StaticMapLayers';

// ==================== MAIN COMPONENT ====================
const ProjectMap: React.FC<{ projectId: string; token: string }> = ({ projectId, token }) => {
    const [interventions, setInterventions] = useState<MapIntervention[]>([]);
    const [trees, setTrees] = useState<MapTree[]>([]);
    const [sites, setSites] = useState<SiteFeatureCollection>({ type: 'FeatureCollection', features: [] });
    const [showSiteBoundaries] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
    // Id of an intervention the poller detected as newly registered; an effect
    // (declared after selectIntervention) auto-selects it once state settles.
    const [autoSelectId, setAutoSelectId] = useState<number | null>(null);
    const [bounds, setBounds] = useState<ProjectMapBounds | null>(null);
    const [hidSearch, setHidSearch] = useState('');
    const [filters, setFilters] = useState<{
        types: Set<string>;
        statuses: Set<string>;
    }>({ types: new Set(), statuses: new Set() });
    const [mapState, setMapState] = useState<MapState>({
        selectedInterventionId: null,
        selectedTreeId: null,
        showTreeDetails: false,
    });
    const hoveredFeatureRef = React.useRef<{ source: string; id: number | string } | null>(null);
    const prevSelectedIdRef = React.useRef<number | null>(null);
    // Tree ids whose full detail has already been fetched, so a re-click does
    // not refetch.
    const detailedTreeIdsRef = React.useRef<Set<number>>(new Set());
    const [isLoadingTreeDetail, setIsLoadingTreeDetail] = useState(false);
    // Remeasurement / status records for the currently open tree, keyed by tree
    // id so a stale fetch from a previous tree never shows under the new one.
    const [treeRecords, setTreeRecords] = useState<{ treeId: number; records: TreeRecord[] } | null>(null);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [showTreeRecords, setShowTreeRecords] = useState(false);
    // Full intervention detail (intervention + owner + trees) fetched on select,
    // and the loading flag that drives the panel loader.
    const [detail, setDetail] = useState<InterventionDetailResponse | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const mapRef = useRef<any>(null);
    // Root container; the fullscreen toggle expands this element so the map and
    // all its overlay panels go fullscreen together.
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<MapError | null>(null);

    // Keep local state in sync with the browser's fullscreen status, so the
    // button reflects exits triggered by Esc or the OS, not just our toggle.
    useEffect(() => {
        const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        } else {
            el.requestFullscreen?.();
        }
    }, []);

    const loadInterventions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchProjectInterventions(projectId, token);
            const loaded = response.data.interventions;
            setInterventions(loaded);
            setFilters(prev => {
                if (prev.types.size === 0 && prev.statuses.size === 0) {
                    return {
                        types: new Set(loaded.map((i: MapIntervention) => i.type)),
                        statuses: new Set(loaded.map((i: MapIntervention) => i.status)),
                    };
                }
                return prev;
            });
            setBounds(response.data.bounds);
        } catch (err: any) {
            setError({
                type: 'network',
                message: err?.message || 'Failed to load interventions',
                details: err,
                recoverable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => { loadInterventions(); }, [loadInterventions]);

    // Mirror of `interventions` for the silent poller, so it can diff against
    // the current set without re-creating the polling timer on every change.
    const interventionsRef = useRef<MapIntervention[]>([]);
    useEffect(() => { interventionsRef.current = interventions; }, [interventions]);

    // Silent background refresh of the interventions layer. Unlike
    // `loadInterventions` it deliberately does NOT show the loading overlay,
    // does NOT re-fit the map (preserving the user's pan/zoom and any open
    // panel/selection), and leaves errors silent so a transient poll failure
    // never wipes the map. New types/statuses are auto-enabled in the filters
    // so freshly uploaded interventions stay visible by default.
    const refreshInterventions = useCallback(async () => {
        try {
            const response = await fetchProjectInterventions(projectId, token);
            const loaded = response.data.interventions;
            const prevTypes = new Set(interventionsRef.current.map(i => i.type));
            const prevStatuses = new Set(interventionsRef.current.map(i => i.status));
            const newTypes = [...new Set(loaded.filter(i => !prevTypes.has(i.type)).map(i => i.type))];
            const newStatuses = [...new Set(loaded.filter(i => !prevStatuses.has(i.status)).map(i => i.status))];
            if (newTypes.length || newStatuses.length) {
                setFilters(prev => ({
                    types: new Set([...prev.types, ...newTypes]),
                    statuses: new Set([...prev.statuses, ...newStatuses]),
                }));
            }

            // Detect interventions that appeared since the last poll (a new
            // registration from the field). Only after a baseline exists, so
            // the first load never auto-selects. If several arrive at once,
            // pick the most recently registered one and treat it as selected:
            // the effect below flies the map to it and opens its detail panel.
            const prevIds = new Set(interventionsRef.current.map(i => i.id));
            const fresh = loaded.filter(i => !prevIds.has(i.id));
            if (interventionsRef.current.length > 0 && fresh.length > 0) {
                const newest = fresh.reduce((latest, i) =>
                    new Date(i.registrationDate || 0).getTime() >
                    new Date(latest.registrationDate || 0).getTime() ? i : latest
                , fresh[0]);
                setAutoSelectId(newest.id);
            }

            setInterventions(loaded);
        } catch (err) {
            console.warn('Silent intervention refresh failed:', err);
        }
    }, [projectId, token]);

    const loadSites = useCallback(async () => {
        try {
            const collection = await fetchProjectSites(projectId, token);
            setSites(collection);
        } catch (err) {
            // Boundaries are supplementary; never block the map on a sites failure.
            console.warn('Failed to load site boundaries:', err);
        }
    }, [projectId, token]);

    const handleSelectSite = useCallback((id: number | null) => {
        setSelectedSiteId(id);
        if (id == null) return;
        const site = sites.features.find(s => s.id === id);
        if (!site) return;
        try {
            const [minLng, minLat, maxLng, maxLat] = turf.bbox(site.geometry as any);
            mapRef.current?.fitBounds([minLng, minLat, maxLng, maxLat], {
                padding: { top: 80, bottom: 80, left: 320, right: 80 },
                duration: 1000,
                maxZoom: 16,
            });
        } catch { /* ignore */ }
    }, [sites.features]);

    useEffect(() => { loadSites(); }, [loadSites]);

    // Auto-refresh map data every 30s so interventions uploaded from the field
    // appear without a manual refresh. Both calls are silent and viewport-safe.
    usePolling(() => {
        refreshInterventions();
        loadSites();
    }, 30_000, !!projectId);

    useEffect(() => {
        if (mapLoaded && bounds && interventions.length > 0) {
            try {
                mapRef.current?.fitBounds(bounds.bounds, {
                    padding: { top: 80, bottom: 80, left: 320, right: 80 },
                    duration: 1500,
                    maxZoom: 15,
                });
            } catch { /* ignore */ }
        }
    }, [mapLoaded, bounds, interventions.length]);

    // Interventions filtered by HID search and type/status, newest first.
    // Sort by registration date (when it was added), falling back to the
    // intervention start date when registration date is missing.
    const filteredInterventions = useMemo(() => {
        const addedTime = (i: MapIntervention) =>
            new Date(i.registrationDate || i.interventionStartDate || 0).getTime();
        return interventions
            .filter(i => {
                if (hidSearch && !i.hid.toLowerCase().includes(hidSearch.toLowerCase())) return false;
                if (!filters.types.has(i.type)) return false;
                if (!filters.statuses.has(i.status)) return false;
                return true;
            })
            .sort((a, b) => addedTime(b) - addedTime(a));
    }, [interventions, hidSearch, filters]);

    const polygonGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: filteredInterventions
            .filter(i => i.location.type === 'Polygon' || i.location.type === 'MultiPolygon')
            .map(i => ({
                type: 'Feature' as const,
                id: i.id,
                properties: {
                    id: i.id,
                    hid: i.hid,
                    color: getInterventionColor(i.type),
                },
                geometry: i.location,
            })),
    }), [filteredInterventions]);

    const pointGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: filteredInterventions
            .filter(i => i.location.type === 'Point')
            .map(i => ({
                type: 'Feature' as const,
                id: i.id,
                properties: {
                    id: i.id,
                    hid: i.hid,
                    color: getInterventionColor(i.type),
                    totalTreeCount: i.totalTreeCount ?? 0,
                },
                geometry: i.location,
            })),
    }), [filteredInterventions]);

    // Centroid dots for polygons at low zoom
    const centroidGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: filteredInterventions
            .filter(i => i.location.type === 'Polygon' || i.location.type === 'MultiPolygon')
            .map(i => {
                const c = i.centroid ?? turf.centroid(i.location as any).geometry;
                return {
                    type: 'Feature' as const,
                    id: i.id,
                    properties: { id: i.id, hid: i.hid, color: getInterventionColor(i.type) },
                    geometry: { type: 'Point' as const, coordinates: (c as any).coordinates },
                };
            }),
    }), [filteredInterventions]);

    const allTypes = useMemo(() => Array.from(new Set(interventions.map(i => i.type))), [interventions]);
    const allStatuses = useMemo(() => Array.from(new Set(interventions.map(i => i.status))), [interventions]);

    const toggleType = useCallback((type: string) => {
        setFilters(prev => {
            const t = new Set(prev.types);
            t.has(type) ? t.delete(type) : t.add(type);
            return { ...prev, types: t };
        });
    }, []);

    const toggleStatus = useCallback((status: string) => {
        setFilters(prev => {
            const s = new Set(prev.statuses);
            s.has(status) ? s.delete(status) : s.add(status);
            return { ...prev, statuses: s };
        });
    }, []);

    const selectIntervention = useCallback((intervention: MapIntervention | null) => {
        const prevId = prevSelectedIdRef.current;
        const map = mapRef.current;
        if (!intervention) {
            setMapState(s => ({ ...s, selectedInterventionId: null, selectedTreeId: null, showTreeDetails: false }));
            setTrees([]);
            try {
                if (prevId != null && map) {
                    map.setFeatureState({ source: 'interventions-points', id: prevId }, { selected: false });
                    map.setFeatureState({ source: 'interventions-polygons', id: prevId }, { selected: false });
                }
                prevSelectedIdRef.current = null;
            } catch { /* ignore */ }
            return;
        }
        setMapState(s => ({ ...s, selectedInterventionId: intervention.id, selectedTreeId: null, showTreeDetails: false }));
        zoomToIntervention(intervention, map);
        try {
            if (prevId != null && map) {
                map.setFeatureState({ source: 'interventions-points', id: prevId }, { selected: false });
                map.setFeatureState({ source: 'interventions-polygons', id: prevId }, { selected: false });
            }
            if (map) {
                map.setFeatureState({ source: 'interventions-points', id: intervention.id }, { selected: true });
                map.setFeatureState({ source: 'interventions-polygons', id: intervention.id }, { selected: true });
            }
            prevSelectedIdRef.current = intervention.id;
        } catch { /* ignore */ }
    }, []);

    // When the poller flags a newly registered intervention, select it just as
    // if the user had clicked it: the map flies to it and its detail panel
    // (with trees) loads via the existing selection effects. Runs once the
    // interventions state already contains the new item, then clears the flag.
    useEffect(() => {
        if (autoSelectId == null) return;
        const target = interventions.find(i => i.id === autoSelectId);
        if (target) selectIntervention(target);
        setAutoSelectId(null);
    }, [autoSelectId, interventions, selectIntervention]);

    const handleMapLoad = useCallback(() => {
        setMapLoaded(true);
        const map = mapRef.current;
        if (!map) return;
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        // pine tree: top triangle
        ctx.beginPath();
        ctx.moveTo(12, 1);
        ctx.lineTo(2, 10);
        ctx.lineTo(22, 10);
        ctx.closePath();
        ctx.fill();
        // pine tree: middle triangle
        ctx.beginPath();
        ctx.moveTo(12, 5);
        ctx.lineTo(1, 16);
        ctx.lineTo(23, 16);
        ctx.closePath();
        ctx.fill();
        // trunk
        ctx.fillRect(10, 15, 4, 7);
        if (!map.hasImage('tree-icon')) {
            map.addImage('tree-icon', ctx.getImageData(0, 0, size, size));
        }
    }, []);

    const handleMapClick = useCallback((event: any) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const layerId = feature.layer?.id;
        // cluster click: zoom in to expand
        if (layerId === 'interventions-points-clusters') {
            const map = mapRef.current;
            if (!map) return;
            const clusterId = feature.properties?.cluster_id;
            const source = map.getSource('interventions-points') as any;
            if (source?.getClusterExpansionZoom) {
                Promise.resolve(source.getClusterExpansionZoom(clusterId))
                    .then((zoom: number) => {
                        const [lng, lat] = (feature.geometry as any).coordinates;
                        map.easeTo({ center: [lng, lat], zoom: zoom + 0.5, duration: 500 });
                    })
                    .catch(() => {});
            }
            return;
        }
        if (!feature.properties?.id) return;
        const intervention = interventions.find(i => i.id === feature.properties.id);
        if (!intervention) return;
        if (mapState.selectedInterventionId === intervention.id) {
            selectIntervention(null);
        } else {
            selectIntervention(intervention);
        }
    }, [interventions, mapState.selectedInterventionId, selectIntervention]);

    const selectedIntervention = useMemo(
        () => interventions.find(i => i.id === mapState.selectedInterventionId),
        [interventions, mapState.selectedInterventionId],
    );

    // A single point at the selected intervention's location (centroid for
    // polygons) that drives the animated "pulse" ring on the map. Empty when
    // nothing is selected so the ring disappears.
    const selectedPulseGeoJSON = useMemo(() => {
        if (!selectedIntervention) {
            return { type: 'FeatureCollection' as const, features: [] };
        }
        const [lng, lat] = getMarkerPosition(selectedIntervention);
        if (!isFinite(lng) || !isFinite(lat)) {
            return { type: 'FeatureCollection' as const, features: [] };
        }
        return {
            type: 'FeatureCollection' as const,
            features: [{
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                properties: {},
            }],
        };
    }, [selectedIntervention]);

    const selectedTree = useMemo(
        () => trees.find(t => t.id === mapState.selectedTreeId),
        [trees, mapState.selectedTreeId],
    );

    // When a tree marker is clicked, fetch its full detail once and merge the
    // result (resolved image, tag, species) back into the tree. The bulk list
    // often lacks the photo, so this is what makes the image appear.
    useEffect(() => {
        const id = mapState.selectedTreeId;
        if (id == null) return;
        const tree = trees.find(t => t.id === id);
        if (!tree || detailedTreeIdsRef.current.has(id)) return;

        detailedTreeIdsRef.current.add(id);
        let cancelled = false;
        (async () => {
            setIsLoadingTreeDetail(true);
            try {
                const detail = await fetchTreeDetail(tree.hid, projectId, token);
                if (!cancelled && detail) {
                    setTrees(prev => prev.map(t => (t.id === id ? { ...t, ...detail } : t)));
                }
            } catch (err) {
                console.warn('Failed to load tree detail:', err);
                // Allow a retry on the next click.
                detailedTreeIdsRef.current.delete(id);
            } finally {
                if (!cancelled) setIsLoadingTreeDetail(false);
            }
        })();
        return () => { cancelled = true; };
    }, [mapState.selectedTreeId, trees, projectId, token]);

    // When a tree detail panel opens, lazily load its remeasurement records.
    // Records are kept separate from the tree object and tagged with the tree id
    // so a slow response for an earlier tree never renders under a newer one.
    useEffect(() => {
        const id = mapState.selectedTreeId;
        if (id == null || !mapState.showTreeDetails) {
            setTreeRecords(null);
            setIsLoadingRecords(false);
            return;
        }
        const tree = trees.find(t => t.id === id);
        if (!tree) return;
        let cancelled = false;
        setIsLoadingRecords(true);
        setTreeRecords(null);
        (async () => {
            try {
                const records = await fetchTreeRecords(tree.hid, projectId, token);
                if (!cancelled) setTreeRecords({ treeId: id, records });
            } catch (err) {
                console.warn('Failed to load tree records:', err);
                if (!cancelled) setTreeRecords({ treeId: id, records: [] });
            } finally {
                if (!cancelled) setIsLoadingRecords(false);
            }
        })();
        return () => { cancelled = true; };
    }, [mapState.selectedTreeId, mapState.showTreeDetails, trees, projectId, token]);

    // When an intervention is selected (map marker or sidebar list), fetch its
    // full detail and plot its trees. A loader covers the panel while the call
    // is in flight. Clears when the selection is cleared.
    useEffect(() => {
        const id = mapState.selectedInterventionId;
        if (id == null) {
            setDetail(null);
            setIsLoadingDetail(false);
            return;
        }
        let cancelled = false;
        setIsLoadingDetail(true);
        setDetail(null);
        setTrees([]);
        detailedTreeIdsRef.current.clear();
        (async () => {
            try {
                const res = await fetchInterventionDetail(id, projectId, token);
                if (cancelled || !res) return;
                setDetail(res);
                setTrees(Array.isArray(res.trees) ? res.trees : []);
            } catch (err) {
                console.warn('Failed to load intervention detail:', err);
            } finally {
                if (!cancelled) setIsLoadingDetail(false);
            }
        })();
        return () => { cancelled = true; };
    }, [mapState.selectedInterventionId, projectId, token]);

    // Prefer the freshly fetched detail (richer: owner, resolved image) but fall
    // back to the bulk list item while the detail call is loading.
    const detailIntervention = detail?.intervention ?? selectedIntervention;

    // Animate a "pulse" ring on the selected intervention so it stands out on
    // the map. A radar-style ring repeatedly expands outward and fades. Runs
    // only while something is selected; the ring layer hides otherwise.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded || mapState.selectedInterventionId == null) return;
        let raf = 0;
        const start = performance.now();
        const PERIOD = 1500; // ms per pulse
        const animate = (now: number) => {
            const t = ((now - start) % PERIOD) / PERIOD; // 0 -> 1
            const radius = 16 + t * 36;        // expands outward
            const opacity = 0.6 * (1 - t);     // fades as it grows
            try {
                if (map.getLayer('selected-pulse-ring')) {
                    map.setPaintProperty('selected-pulse-ring', 'circle-radius', radius);
                    map.setPaintProperty('selected-pulse-ring', 'circle-stroke-opacity', opacity);
                }
            } catch { /* layer not ready yet */ }
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [mapLoaded, mapState.selectedInterventionId]);

    if (isLoading) {
        return (
            <div className="relative w-full h-screen">
                <LoadingDisplay message="Loading interventions..." />
            </div>
        );
    }

    if (error && !error.recoverable) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load map</h2>
                    <p className="text-sm text-gray-500 mb-4">{error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-white px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#007A49' }}
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-gray-900">
            <Map
                ref={mapRef}
                onLoad={handleMapLoad}
                mapStyle={MAP_STYLE}
                initialViewState={{
                    longitude: bounds?.center[0] ?? 0,
                    latitude: bounds?.center[1] ?? 0,
                    zoom: 5,
                }}
                style={MAP_CONTAINER_STYLE}
                interactiveLayerIds={INTERACTIVE_LAYER_IDS}
                onClick={handleMapClick}
                onMouseMove={event => {
                    try {
                        const map = mapRef.current;
                        const feature = event.features?.[0];
                        const prev = hoveredFeatureRef.current;
                        if (feature && (feature.properties?.id ?? feature.id) != null) {
                            const id = feature.properties?.id ?? feature.id;
                            const source = feature.source || feature.layer?.source;
                            if (map) map.getCanvas().style.cursor = 'pointer';
                            if (prev && (prev.id !== id || prev.source !== source)) {
                                map?.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                                hoveredFeatureRef.current = null;
                            }
                            if (!prev || prev.id !== id || prev.source !== source) {
                                map?.setFeatureState({ source, id }, { hover: true });
                                hoveredFeatureRef.current = { source, id };
                            }
                        } else if (prev) {
                            map?.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                            hoveredFeatureRef.current = null;
                            if (map) map.getCanvas().style.cursor = '';
                        }
                    } catch { /* ignore */ }
                }}
                onMouseLeave={() => {
                    try {
                        const prev = hoveredFeatureRef.current;
                        if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
                        if (prev && mapRef.current) {
                            mapRef.current.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                            hoveredFeatureRef.current = null;
                        }
                    } catch { /* ignore */ }
                }}
                onError={() => { /* suppress tile load errors */ }}
            >
                {/* Static site + intervention layers. Memoized so selecting an
                    intervention (which re-renders ProjectMap) does not re-render
                    these layers, preventing the shapes/markers from blinking.
                    Selection/hover highlight is driven by feature-state, set
                    imperatively below, so it still works without re-rendering. */}
                <StaticMapLayers
                    showSiteBoundaries={showSiteBoundaries}
                    sites={sites}
                    polygonGeoJSON={polygonGeoJSON}
                    centroidGeoJSON={centroidGeoJSON}
                    pointGeoJSON={pointGeoJSON}
                    mapLoaded={mapLoaded}
                />

                {/* Pulsing ring on the selected intervention (animated in an
                    effect via setPaintProperty). Sits above the intervention
                    layers so it is always visible. */}
                {selectedPulseGeoJSON.features.length > 0 && (
                    <Source id="selected-pulse" type="geojson" data={selectedPulseGeoJSON}>
                        <Layer
                            id="selected-pulse-ring"
                            type="circle"
                            paint={{
                                'circle-radius': 16,
                                'circle-color': 'rgba(0,0,0,0)',
                                'circle-stroke-color': BRAND,
                                'circle-stroke-width': 3,
                                'circle-stroke-opacity': 0.6,
                            }}
                        />
                    </Source>
                )}

                {/* Tree markers — only trees that carry a valid point */}
                {trees.filter(t => t.location?.type === 'Point').map(tree => (
                    <TreeMarker
                        key={tree.id}
                        tree={tree}
                        isSelected={mapState.selectedTreeId === tree.id}
                        onClick={() => {
                            setMapState(prev => ({ ...prev, selectedTreeId: tree.id, showTreeDetails: true }));
                            const [lng, lat] = tree.location.coordinates as [number, number];
                            if (isFinite(lng) && isFinite(lat)) {
                                // Recenter onto the tree, offset left so the detail
                                // panel on the right does not cover the highlight.
                                mapRef.current?.easeTo({ center: [lng, lat], offset: [-130, 0], duration: 600 });
                            }
                        }}
                    />
                ))}
            </Map>

            {/* Error */}
            <AnimatePresence>
                {error?.recoverable && (
                    <ErrorDisplay
                        error={error}
                        onRetry={loadInterventions}
                        onDismiss={() => setError(null)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - site selector + search + filter + scrollable intervention list */}
            <InterventionSidebar
                interventions={filteredInterventions}
                selectedId={mapState.selectedInterventionId}
                onSelect={selectIntervention}
                hidSearch={hidSearch}
                onHidSearch={setHidSearch}
                types={allTypes}
                statuses={allStatuses}
                activeTypes={filters.types}
                activeStatuses={filters.statuses}
                onToggleType={toggleType}
                onToggleStatus={toggleStatus}
                total={interventions.length}
                sites={sites.features}
                selectedSiteId={selectedSiteId}
                onSelectSite={handleSelectSite}
            />

            {/* Intervention detail panel - top right. Hidden while a tree
                detail is open so the two never overlap; closing the tree
                returns to this panel. */}
            <AnimatePresence>
                {detailIntervention && !(selectedTree && mapState.showTreeDetails) && (
                    <InterventionPanel
                        intervention={detailIntervention}
                        trees={detail?.trees ?? trees}
                        isLoading={isLoadingDetail}
                        onClose={() => selectIntervention(null)}
                        onZoomTo={i => zoomToIntervention(i, mapRef.current)}
                        onSelectTree={(tree) => {
                            setMapState(prev => ({ ...prev, selectedTreeId: tree.id, showTreeDetails: true }));
                            const map = mapRef.current;
                            if (map && tree.location?.type === 'Point') {
                                const [lng, lat] = tree.location.coordinates as [number, number];
                                map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom?.() ?? 16, 17), duration: 600 });
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Tree detail panel - replaces the intervention panel while open */}
            <AnimatePresence>
                {selectedTree && mapState.showTreeDetails && (
                    <TreeTooltip
                        key={selectedTree.id}
                        tree={selectedTree}
                        isLoadingDetail={isLoadingTreeDetail}
                        records={treeRecords?.treeId === selectedTree.id ? treeRecords.records : []}
                        isLoadingRecords={isLoadingRecords || treeRecords?.treeId !== selectedTree.id}
                        onViewRecords={() => setShowTreeRecords(v => !v)}
                        onClose={() => {
                            setShowTreeRecords(false);
                            setMapState(prev => ({ ...prev, selectedTreeId: null, showTreeDetails: false }));
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Records panel - slides in to the left of the tree tooltip */}
            <AnimatePresence>
                {selectedTree && mapState.showTreeDetails && showTreeRecords && (
                    <RecordsPanel
                        key={`records-${selectedTree.id}`}
                        records={treeRecords?.treeId === selectedTree.id ? treeRecords.records : []}
                        isLoadingRecords={isLoadingRecords || treeRecords?.treeId !== selectedTree.id}
                        onClose={() => setShowTreeRecords(false)}
                    />
                )}
            </AnimatePresence>

            {/* Legend - bottom left */}
            <MapLegend />

            {/* Zoom controls */}
            <div className="absolute bottom-10 right-3 z-20 flex flex-col gap-1.5">
                <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-2xl shadow-md border border-gray-200 transition-colors mb-1"
                    title={isFullscreen ? 'Exit full screen' : 'View full screen'}
                >
                    {isFullscreen
                        ? <Minimize2 size={15} className="text-gray-600" strokeWidth={2.5} />
                        : <Maximize2 size={15} className="text-gray-600" strokeWidth={2.5} />}
                </button>
                <button
                    onClick={() => mapRef.current?.zoomIn()}
                    className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-2xl shadow-md border border-gray-200 transition-colors"
                    title="Zoom in"
                >
                    <Plus size={17} className="text-gray-600" strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => mapRef.current?.zoomOut()}
                    className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-2xl shadow-md border border-gray-200 transition-colors"
                    title="Zoom out"
                >
                    <Minus size={17} className="text-gray-600" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default ProjectMap;
