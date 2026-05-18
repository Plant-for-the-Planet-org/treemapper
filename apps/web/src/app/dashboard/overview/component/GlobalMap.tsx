import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import * as turf from '@turf/turf';
import { getAllMapInterevntions } from '@shared-core/fetchApi/api.fetch';
import { baseUrl } from '@shared-core/fetchApi/api.url';

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
    currentHeight?: number;
    currentWidth?: number;
    currentHealthScore?: number;
    plantingDate?: string;
    lastMeasurementDate?: string;
    image?: string;
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

interface InterventionTreesResponse {
    trees: MapTree[];
    intervention: MapIntervention;
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
    isLoadingTrees: boolean;
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

const fetchInterventionTrees = async (interventionId: number, token?: string): Promise<ApiResponse<InterventionTreesResponse>> => {
    const url = `${baseUrl}/interventions/${interventionId}/map/tree`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (data?.success && data.data) return data as ApiResponse<InterventionTreesResponse>;
    if (Array.isArray(data?.trees)) return { success: true, data };
    return {
        success: false,
        data: { trees: [], intervention: {} as MapIntervention, bounds: { bounds: [-180, -85, 180, 85], center: [0, 0] } },
        message: 'Unexpected response format',
    };
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
}> = ({ interventions, selectedId, onSelect, hidSearch, onHidSearch, types, statuses, activeTypes, activeStatuses, onToggleType, onToggleStatus, total }) => {
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
        <div className="absolute top-4 left-4 bottom-20 z-40 w-72 flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header: search + filter */}
            <div className="shrink-0 border-b border-gray-100">
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
                            {i.area && <span>{i.area.toFixed(1)} m²</span>}
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
        <Marker longitude={lng} latitude={lat} onClick={onClick}>
            <Trees
                size={isSelected ? 20 : 16}
                color={color}
                fill={color}
                className="cursor-pointer drop-shadow-sm"
            />
        </Marker>
    );
};

const InterventionPanel: React.FC<{
    intervention: MapIntervention;
    onClose: () => void;
    onLoadTrees?: (id: number) => Promise<void>;
    isLoadingTrees?: boolean;
    onZoomTo?: (intervention: MapIntervention) => void;
    treesCount?: number;
}> = ({ intervention, onClose, onLoadTrees, isLoadingTrees = false, onZoomTo, treesCount = 0 }) => {
    const centroidText = useMemo(() => {
        try {
            let c: any;
            if (intervention.centroid) {
                c = intervention.centroid.coordinates;
            } else if (intervention.location.type === 'Point') {
                c = intervention.location.coordinates;
            } else {
                c = turf.centroid(intervention.location as any).geometry.coordinates;
            }
            return `${c[0].toFixed(5)}, ${c[1].toFixed(5)}`;
        } catch {
            return '—';
        }
    }, [intervention]);

    return (
        <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="absolute top-4 right-4 w-88 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto"
            style={{ width: 360 }}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{intervention.hid}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                {intervention.type.replace(/-/g, ' ')}
                            </span>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full capitalize"
                                style={intervention.status === 'complete' || intervention.status === 'completed' ? {
                                    backgroundColor: 'rgba(0,122,73,0.08)',
                                    color: '#007A49',
                                } : undefined}
                            >
                                {intervention.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => onZoomTo?.(intervention)}
                            className="text-xs px-2 py-1 rounded transition-colors hover:bg-gray-50"
                            style={{ color: '#007A49' }}
                        >
                            Zoom
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Start</div>
                        <div className="text-sm text-gray-800">{formatDate(intervention.interventionStartDate)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Registered</div>
                        <div className="text-sm text-gray-800">{formatDate(intervention.registrationDate)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Trees</div>
                        <div className="text-sm font-medium text-gray-800">
                            {intervention.totalTreeCount?.toLocaleString() ?? 0}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Area</div>
                        <div className="text-sm text-gray-800">
                            {intervention.area ? `${intervention.area.toFixed(2)} m²` : '—'}
                        </div>
                    </div>
                </div>

                {intervention.description && (
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Description</div>
                        <p className="text-sm text-gray-700">{intervention.description}</p>
                    </div>
                )}

                {intervention.image && (
                    <img
                        src={intervention.image}
                        alt={intervention.hid}
                        className="w-full h-36 object-cover rounded-lg"
                    />
                )}

                {/* Load Trees */}
                <div className="flex items-center justify-between pt-1">
                    <span className="text-sm text-gray-500">
                        Sample trees: <span className="font-medium text-gray-700">{intervention.totalSampleTreeCount ?? '—'}</span>
                        {treesCount > 0 && <span className="ml-2" style={{ color: '#007A49' }}>({treesCount} loaded)</span>}
                    </span>
                    <button
                        onClick={() => onLoadTrees?.(intervention.id)}
                        disabled={isLoadingTrees}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-60 transition-opacity"
                        style={{ backgroundColor: '#007A49' }}
                    >
                        {isLoadingTrees ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trees className="w-3 h-3" />}
                        {isLoadingTrees ? 'Loading...' : 'Load Trees'}
                    </button>
                </div>

                {/* Meta */}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="text-xs text-gray-400">
                        HID: <span className="font-mono text-gray-600">{intervention.hid}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        Geometry: <span className="text-gray-600">{intervention.locationGeometryType || intervention.location.type}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        Centroid: <span className="font-mono text-gray-600">{centroidText}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TreeTooltip: React.FC<{
    tree: MapTree;
    onClose: () => void;
}> = ({ tree, onClose }) => (
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="absolute top-4 right-4 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-30"
    >
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div>
                <div className="font-medium text-gray-900 text-sm">{tree.tag || tree.hid}</div>
                {tree.speciesName && <div className="text-xs text-gray-500">{tree.speciesName}</div>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
            </button>
        </div>
        <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTreeStatusColor(tree.status) }} />
                <span className="capitalize text-gray-700">{tree.status}</span>
            </div>
            {tree.currentHeight && (
                <div className="text-xs text-gray-600">Height: {tree.currentHeight} cm</div>
            )}
            {tree.currentHealthScore && (
                <div className="text-xs text-gray-600">Health: {tree.currentHealthScore}/100</div>
            )}
        </div>
    </motion.div>
);

const MapLegend: React.FC = () => (
     null
);

// ==================== MAIN COMPONENT ====================
const ProjectMap: React.FC<{ projectId: string; token: string }> = ({ projectId, token }) => {
    const [interventions, setInterventions] = useState<MapIntervention[]>([]);
    const [trees, setTrees] = useState<MapTree[]>([]);
    const [bounds, setBounds] = useState<ProjectMapBounds | null>(null);
    const [hidSearch, setHidSearch] = useState('');
    const [filters, setFilters] = useState<{
        types: Set<string>;
        statuses: Set<string>;
    }>({ types: new Set(), statuses: new Set() });
    const [mapState, setMapState] = useState<MapState>({
        selectedInterventionId: null,
        selectedTreeId: null,
        isLoadingTrees: false,
        showTreeDetails: false,
    });
    const hoveredFeatureRef = React.useRef<{ source: string; id: number | string } | null>(null);
    const prevSelectedIdRef = React.useRef<number | null>(null);
    const mapRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<MapError | null>(null);

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

    // Interventions filtered by HID search and type/status
    const filteredInterventions = useMemo(() => {
        return interventions.filter(i => {
            if (hidSearch && !i.hid.toLowerCase().includes(hidSearch.toLowerCase())) return false;
            if (!filters.types.has(i.type)) return false;
            if (!filters.statuses.has(i.status)) return false;
            return true;
        });
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

    const handlePolygonClick = useCallback((event: any) => {
        const feature = event.features?.[0];
        if (!feature?.properties?.id) return;
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

    const selectedTree = useMemo(
        () => trees.find(t => t.id === mapState.selectedTreeId),
        [trees, mapState.selectedTreeId],
    );

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
        <div className="relative w-full h-full">
            <Map
                ref={mapRef}
                onLoad={() => setMapLoaded(true)}
                mapStyle={{
                    version: 8,
                    name: 'Satellite',
                    bearing: 0,
                    pitch: 0,
                    sources: {
                        imagery: {
                            type: 'raster',
                            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                            tileSize: 256,
                            minzoom: 0,
                            maxzoom: 18,
                        },
                    },
                    layers: [
                        {
                            id: 'imagery',
                            type: 'raster',
                            source: 'imagery',
                            minzoom: 0,
                            layout: { visibility: 'visible' },
                        },
                    ],
                }}
                initialViewState={{
                    longitude: bounds?.center[0] ?? 0,
                    latitude: bounds?.center[1] ?? 0,
                    zoom: 5,
                }}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={[
                    'interventions-polygons-fill',
                    'interventions-polygons-outline',
                    'interventions-points-circle',
                    'interventions-centroids-circle',
                ]}
                onClick={handlePolygonClick}
                onMouseMove={event => {
                    try {
                        const map = mapRef.current;
                        const feature = event.features?.[0];
                        const prev = hoveredFeatureRef.current;
                        if (feature && (feature.properties?.id ?? feature.id) != null) {
                            const id = feature.properties?.id ?? feature.id;
                            const source = feature.source || feature.layer?.source;
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
                        }
                    } catch { /* ignore */ }
                }}
                onMouseLeave={() => {
                    try {
                        const prev = hoveredFeatureRef.current;
                        if (prev && mapRef.current) {
                            mapRef.current.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                            hoveredFeatureRef.current = null;
                        }
                    } catch { /* ignore */ }
                }}
                onError={() => { /* suppress tile load errors */ }}
            >
                {/* Polygon fills (close zoom) */}
                {polygonGeoJSON.features.length > 0 && (
                    <Source id="interventions-polygons" type="geojson" data={polygonGeoJSON}>
                        <Layer
                            id="interventions-polygons-fill"
                            type="fill"
                            minzoom={11}
                            paint={{
                                'fill-color': ['get', 'color'],
                                'fill-opacity': [
                                    'case',
                                    ['feature-state', 'selected'], 0.42,
                                    ['feature-state', 'hover'], 0.28,
                                    0.15,
                                ],
                            }}
                        />
                        <Layer
                            id="interventions-polygons-outline"
                            type="line"
                            minzoom={11}
                            paint={{
                                'line-color': ['get', 'color'],
                                'line-width': [
                                    'case',
                                    ['feature-state', 'selected'], 2.5,
                                    ['feature-state', 'hover'], 2,
                                    1.5,
                                ],
                                'line-opacity': [
                                    'case',
                                    ['feature-state', 'selected'], 1,
                                    0.75,
                                ],
                            }}
                        />
                    </Source>
                )}

                {/* Centroid dots for polygons at low zoom */}
                {centroidGeoJSON.features.length > 0 && (
                    <Source id="interventions-centroids" type="geojson" data={centroidGeoJSON}>
                        <Layer
                            id="interventions-centroids-circle"
                            type="circle"
                            maxzoom={11}
                            paint={{
                                'circle-color': ['get', 'color'],
                                'circle-radius': [
                                    'interpolate', ['linear'], ['zoom'],
                                    0, 4, 6, 7, 10, 11,
                                ],
                                'circle-opacity': ['case', ['feature-state', 'hover'], 1, 0.85],
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                            }}
                        />
                    </Source>
                )}

                {/* Point interventions */}
                {pointGeoJSON.features.length > 0 && (
                    <Source id="interventions-points" type="geojson" data={pointGeoJSON}>
                        <Layer
                            id="interventions-points-circle"
                            type="circle"
                            paint={{
                                'circle-color': ['get', 'color'],
                                'circle-radius': [
                                    'case',
                                    ['feature-state', 'selected'], 12,
                                    ['feature-state', 'hover'], 10,
                                    8,
                                ],
                                'circle-stroke-width': [
                                    'case',
                                    ['feature-state', 'selected'], 3,
                                    ['feature-state', 'hover'], 2.5,
                                    2,
                                ],
                                'circle-stroke-color': '#ffffff',
                                'circle-opacity': [
                                    'case',
                                    ['feature-state', 'selected'], 1,
                                    ['feature-state', 'hover'], 0.95,
                                    0.9,
                                ],
                            }}
                        />
                    </Source>
                )}

                {/* Tree markers */}
                {trees.map(tree => (
                    <TreeMarker
                        key={tree.id}
                        tree={tree}
                        isSelected={mapState.selectedTreeId === tree.id}
                        onClick={() => setMapState(prev => ({ ...prev, selectedTreeId: tree.id, showTreeDetails: true }))}
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

            {/* Sidebar - search, filter + scrollable intervention list */}
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
            />

            {/* Intervention detail panel - top right */}
            <AnimatePresence>
                {selectedIntervention && (
                    <InterventionPanel
                        intervention={selectedIntervention}
                        onClose={() => selectIntervention(null)}
                        onLoadTrees={async (id: number) => {
                            setMapState(prev => ({ ...prev, isLoadingTrees: true }));
                            try {
                                const res = await fetchInterventionTrees(id, token);
                                const treesData = res?.data?.trees ?? (res as any)?.trees ?? [];
                                setTrees(Array.isArray(treesData) ? treesData : []);
                            } catch (err) {
                                console.warn('Failed to load trees:', err);
                            } finally {
                                setMapState(prev => ({ ...prev, isLoadingTrees: false }));
                            }
                        }}
                        isLoadingTrees={mapState.isLoadingTrees}
                        onZoomTo={i => zoomToIntervention(i, mapRef.current)}
                        treesCount={trees.length}
                    />
                )}
            </AnimatePresence>

            {/* Tree tooltip - only when no intervention panel */}
            <AnimatePresence>
                {selectedTree && mapState.showTreeDetails && !selectedIntervention && (
                    <TreeTooltip
                        tree={selectedTree}
                        onClose={() => setMapState(prev => ({ ...prev, selectedTreeId: null, showTreeDetails: false }))}
                    />
                )}
            </AnimatePresence>

            {/* Trees loading indicator */}
            {mapState.isLoadingTrees && (
                <div className="absolute bottom-8 right-4 bg-white rounded-lg shadow border border-gray-100 px-3 py-2 flex items-center gap-2 z-20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    <span className="text-xs text-gray-600">Loading trees...</span>
                </div>
            )}

            {/* Legend - bottom left */}
            <MapLegend />
        </div>
    );
};

export default ProjectMap;
