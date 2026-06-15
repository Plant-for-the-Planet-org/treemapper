import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
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
    Plus,
    Minus,
    Layers,
    Copy,
    Check,
    MapPin,
    User,
    History,
    ArrowRight,
    ArrowLeft,
    ChevronRight,
    Sprout,
    Shield,
    Target,
    Leaf,
    Download,
    CloudCheck,
    CloudAlert,
    type LucideIcon,
} from 'lucide-react';
import * as turf from '@turf/turf';
import { getAllMapInterevntions, getProjectSitesMap } from '@shared-core/fetchApi/api.fetch';
import { cdnUrl } from '@/lib/cdn';
import { baseUrl } from '@shared-core/fetchApi/api.url';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ==================== TYPES ====================
interface MapIntervention {
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
const FILL_COLOR = '#68B030';
const BORDER_COLOR = '#ffffff';
// Site boundary outline — amber reads clearly over satellite imagery and
// stays distinct from the green intervention polygons.
const SITE_BOUNDARY_COLOR = '#FBBF24';

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

// Intervention type -> icon, mirroring the interventions list page so the
// overview reads consistently with the rest of the dashboard.
const interventionTypeIcons: Record<string, LucideIcon> = {
    'enrichment-planting': Trees,
    'direct-seeding': Sprout,
    'removal-invasive-species': Shield,
    'maintenance': Activity,
    'fencing': Shield,
    'fire-patrol': Shield,
    'soil-improvement': Leaf,
    'grass-suppression': Leaf,
    'single-tree-registration': Trees,
    'multi-tree-registration': Trees,
    'other-intervention': Target,
};

const getInterventionIcon = (type: string): LucideIcon =>
    interventionTypeIcons[type] ?? Target;

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

// Group a number with thousands separators, up to `digits` decimals.
const formatNum = (n: number, digits = 0): string =>
    n.toLocaleString('en-US', { maximumFractionDigits: digits });

// Format an area in m² into a human-readable label.
// >= 10,000 m² (1 ha) → show in hectares; otherwise m². Thousands grouped.
const formatArea = (sqm: number): string =>
    sqm >= 10_000
        ? `${formatNum(sqm / 10_000, 2)} ha`
        : `${formatNum(sqm, 2)} m²`;

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
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
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

// Sync / capture indicator, matching the interventions list page: a planning
// badge, a green cloud-check when fully synced, or an amber cloud-alert when not.
const SyncStatus: React.FC<{ status: string; captureStatus?: string }> = ({ status, captureStatus }) => {
    if (status === 'planning') {
        return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                Planning
            </Badge>
        );
    }
    if (captureStatus === 'complete') {
        return <CloudCheck className="h-3.5 w-3.5 text-primary" aria-label="Synced" />;
    }
    return <CloudAlert className="h-3.5 w-3.5 text-amber-600" aria-label="Not synced" />;
};

// Site filter dropdown. Rendered as a map overlay (top-left) rather than inside
// the list, so it reads as a map control.
const SiteSelect: React.FC<{
    sites: SiteFeature[];
    selectedSiteId: number | null;
    onSelectSite: (id: number | null) => void;
}> = ({ sites, selectedSiteId, onSelectSite }) => {
    if (sites.length === 0) return null;
    return (
        <Select
            value={selectedSiteId != null ? String(selectedSiteId) : 'all'}
            onValueChange={v => onSelectSite(v === 'all' ? null : Number(v))}
        >
            <SelectTrigger size="sm" className="w-[200px] bg-background/95 shadow-md border-border">
                <span className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="All sites" />
                </span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All sites</SelectItem>
                {sites.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.properties.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

const InterventionSidebar: React.FC<{
    interventions: MapIntervention[];
    selectedId: number | null;
    onSelect: (intervention: MapIntervention) => void;
    hidSearch: string;
    onHidSearch: (v: string) => void;
    total: number;
}> = ({ interventions, selectedId, onSelect, hidSearch, onHidSearch, total }) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedId == null) return;
        const el = listRef.current?.querySelector(`[data-id="${selectedId}"]`);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedId]);

    return (
        <div className="col-span-1 h-full flex flex-col bg-card text-card-foreground border border-border rounded-2xl overflow-hidden">
            {/* Header: search */}
            <div className="shrink-0 border-b border-border">
                <div className="px-3 pt-3 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                            value={hidSearch}
                            onChange={e => onHidSearch(e.target.value)}
                            placeholder="Search by HID..."
                            className="h-9 pl-8 pr-8"
                        />
                        {hidSearch && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => onHidSearch('')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="px-3 pb-2">
                    <span className="text-xs text-muted-foreground">
                        {interventions.length === total
                            ? `${formatNum(total)} interventions`
                            : `${formatNum(interventions.length)} of ${formatNum(total)} shown`}
                    </span>
                </div>
            </div>

            {/* Scrollable intervention list */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {interventions.map(i => {
                    const Icon = getInterventionIcon(i.type);
                    const selected = selectedId === i.id;
                    const hasArea = i.area || i.location.type === 'Polygon' || i.location.type === 'MultiPolygon';
                    return (
                        <Card
                            key={i.id}
                            data-id={i.id}
                            onClick={() => onSelect(i)}
                            className={cn(
                                'py-0 gap-0 rounded-lg shadow-none ring-0 border cursor-pointer transition-colors',
                                selected ? 'bg-primary/10 border-primary/30' : 'border-border hover:bg-muted/50',
                            )}
                        >
                            <CardContent className="p-2.5">
                                <div className="flex items-start gap-2.5">
                                    <div className={cn(
                                        'p-2 rounded-md shrink-0',
                                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1.5 mb-1">
                                            <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground/80 truncate">
                                                {i.hid}
                                            </span>
                                            <span className="shrink-0">
                                                <SyncStatus status={i.status} captureStatus={i.captureStatus} />
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize truncate mb-1">
                                            {i.type.replace(/-/g, ' ')}
                                        </div>
                                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Trees className="h-3 w-3" />
                                                <span className="font-medium text-foreground/80">{(i.totalTreeCount ?? 0).toLocaleString()}</span>
                                                <span>trees</span>
                                            </span>
                                            {hasArea && <span>{resolveArea(i)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {interventions.length === 0 && (
                    <div className="py-10 text-center text-xs text-muted-foreground">No interventions found</div>
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
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-popover text-popover-foreground rounded-lg shadow-xl border border-destructive/30 max-w-md"
    >
        <div className="p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">Map Error</h3>
                    <p className="text-sm text-muted-foreground mb-3">{error.message}</p>
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
                    <button onClick={onDismiss} className="text-muted-foreground hover:text-muted-foreground shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

const LoadingDisplay: React.FC<{ message?: string }> = ({ message = 'Loading map...' }) => (
    <div className="absolute inset-0 bg-muted flex items-center justify-center z-40">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
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
            className={`inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className ?? 'w-6 h-6'}`}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
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
                className="rounded-full object-cover bg-muted shrink-0"
                style={px}
            />
        );
    }
    return (
        <span
            className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0"
            style={{ ...px, fontSize: Math.max(10, size * 0.42) }}
        >
            {initialsOf(name)}
        </span>
    );
};

// One tree in the panel's scrollable list. Shows the photo, identity, latest
// measurements, owner, and a copy-coordinates action. Clicking opens the tree.
// Compact grid cell for a sample tree: photo thumbnail with a status dot and a
// label overlay. Clicking opens the tree detail; full data lives on the
// intervention page.
const TreeGridItem: React.FC<{ tree: MapTree; onSelect: (tree: MapTree) => void }> = ({ tree, onSelect }) => {
    const [imgErr, setImgErr] = useState(false);
    const photo = buildTreeImageUrl(tree);
    const statusColor = getTreeStatusColor(tree.status);
    const label = tree.tag ? `Tag ${tree.tag}` : tree.hid;

    return (
        <button
            type="button"
            onClick={() => onSelect(tree)}
            title={label}
            className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-border hover:border-primary/40 transition-colors"
        >
            {photo && !imgErr ? (
                <img
                    src={photo}
                    alt={label}
                    loading="lazy"
                    onError={() => setImgErr(true)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                    <Trees className="w-5 h-5" strokeWidth={1.5} />
                </div>
            )}
            <span
                className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full ring-2 ring-white/80 shadow"
                style={{ backgroundColor: statusColor }}
                title={tree.status}
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-1.5 pt-3 pb-1 text-[10px] font-medium text-white truncate">
                {label}
            </span>
        </button>
    );
};

const InterventionPanel: React.FC<{
    intervention: MapIntervention;
    trees: MapTree[];
    isLoading?: boolean;
    projectUid: string;
    onClose: () => void;
    onSelectTree: (tree: MapTree) => void;
}> = ({ intervention, trees, isLoading = false, projectUid, onClose, onSelectTree }) => {
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

    // Download the intervention geometry as a GeoJSON Feature, named by HID.
    const downloadGeoJSON = () => {
        const feature = {
            type: 'Feature',
            properties: {
                hid: intervention.hid,
                type: intervention.type,
                totalTreeCount: intervention.totalTreeCount ?? 0,
            },
            geometry: intervention.location,
        };
        const blob = new Blob([JSON.stringify(feature, null, 2)], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${intervention.hid}.geojson`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full bg-card text-card-foreground flex flex-col overflow-hidden">
            {/* Header — no intervention photo; tree photos live in the list below */}
            <div className="shrink-0 px-4 py-3 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{intervention.hid}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge variant="secondary" className="capitalize">
                                {intervention.type.replace(/-/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        title="Close"
                        className="rounded-full text-muted-foreground shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 px-4 pt-3">
                    <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Start date</div>
                        <div className="text-sm text-foreground">{formatDate(intervention.interventionStartDate)}</div>
                    </div>
                    {(intervention.location.type === 'Polygon' || intervention.location.type === 'MultiPolygon') && (
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Area</div>
                            <div className="text-sm text-foreground">{resolveArea(intervention)}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Total trees</div>
                        <div className="text-sm font-medium text-foreground">{intervention.totalTreeCount?.toLocaleString() ?? 0}</div>
                    </div>
                </div>

                {/* Coordinates — only for single points; a polygon has no single
                    lat/lng, so we offer its geometry via the GeoJSON download. */}
                {intervention.location.type === 'Point' && (
                    <div className="px-4 pt-3">
                        <div className="text-xs text-muted-foreground mb-1">Coordinates</div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-3 text-sm font-mono text-foreground">
                                <span><span className="text-xs text-muted-foreground mr-1">Lat</span>{centroidCoords?.lat ?? '—'}</span>
                                <span><span className="text-xs text-muted-foreground mr-1">Lng</span>{centroidCoords?.lng ?? '—'}</span>
                            </div>
                            <CopyButton value={`${centroidCoords?.lat ?? ''}, ${centroidCoords?.lng ?? ''}`} title="Copy coordinates" />
                        </div>
                    </div>
                )}

                {/* Description */}
                {intervention.description && (
                    <div className="px-4 pt-3">
                        <div className="text-xs text-muted-foreground mb-0.5">Description</div>
                        <p className="text-sm text-foreground">{intervention.description}</p>
                    </div>
                )}

                {/* Sample trees — compact grid. Full per-tree data lives on the
                    intervention page; this is a quick visual + drill-in. */}
                <div className="px-4 pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-foreground">
                            Sample trees {!isLoading && (
                                <span className="text-muted-foreground font-normal">
                                    ({intervention.totalSampleTreeCount && intervention.totalSampleTreeCount !== trees.length
                                        ? `${formatNum(trees.length)} of ${formatNum(intervention.totalSampleTreeCount)}`
                                        : formatNum(trees.length)})
                                </span>
                            )}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs mt-2">Loading details...</span>
                        </div>
                    ) : trees.length === 0 ? (
                        <div className="flex items-center gap-1.5 py-1.5 text-xs text-muted-foreground">
                            <Trees className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                            No sample trees recorded
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {trees.map(tree => (
                                <TreeGridItem key={tree.id} tree={tree} onSelect={onSelectTree} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Added by — secondary info, kept at the bottom */}
                {intervention.owner?.displayName && (
                    <div className="flex items-center gap-2 px-4 pt-1 pb-3">
                        <OwnerAvatar name={intervention.owner.displayName} image={intervention.owner.image} size={26} />
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Added by
                            </div>
                            <div className="text-sm text-foreground truncate">{intervention.owner.displayName}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer actions — always visible */}
            <div className="shrink-0 border-t border-border p-3 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/project/${projectUid}/intervention?id=${intervention.uid}`}>
                        Manage
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={downloadGeoJSON} title="Download GeoJSON">
                    <Download className="w-4 h-4" />
                    GeoJSON
                </Button>
            </div>
        </div>
    );
};

const DetailStat: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}> = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-sm text-foreground truncate">{value}</div>
        </div>
    </div>
);

const TreeTooltip: React.FC<{
    tree: MapTree;
    onClose: () => void;
    isLoadingDetail?: boolean;
    records?: TreeRecord[];
    isLoadingRecords?: boolean;
    showRecords?: boolean;
    onViewRecords?: () => void;
}> = ({ tree, onClose, isLoadingDetail = false, records = [], isLoadingRecords = false, showRecords = false, onViewRecords }) => {
    const statusColor = getTreeStatusColor(tree.status);
    const treeImage = buildTreeImageUrl(tree);
    const speciesImage = buildSpeciesImageUrl(tree.speciesImage);
    const [treeImgError, setTreeImgError] = useState(false);
    const [speciesImgError, setSpeciesImgError] = useState(false);

    const showTreeImage = treeImage && !treeImgError;
    const showSpeciesImage = speciesImage && !speciesImgError;

    const height = formatHeight(tree.height);
    const width = formatWidth(tree.width);
    const coords = tree.location?.type === 'Point'
        ? `${tree.location.coordinates[1].toFixed(6)}, ${tree.location.coordinates[0].toFixed(6)}`
        : null;

    return (
        <div className="w-full h-full bg-card text-card-foreground flex flex-col overflow-hidden">
            {/* Back to intervention */}
            <button
                onClick={onClose}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border-b border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to intervention
            </button>

            {/* Image header / banner */}
            <div className="relative h-40 shrink-0 bg-muted">
                {showTreeImage ? (
                    <img
                        src={treeImage as string}
                        alt={tree.tag || tree.hid}
                        className="w-full h-full object-cover"
                        onError={() => setTreeImgError(true)}
                    />
                ) : isLoadingDetail ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="w-7 h-7 animate-spin" strokeWidth={1.5} />
                        <span className="text-xs mt-1.5">Loading photo...</span>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                        <Trees className="w-10 h-10" strokeWidth={1.5} />
                        <span className="text-xs mt-1.5 text-muted-foreground">No tree photo</span>
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
            </div>

            <div
                className="overflow-y-auto flex-1 min-h-0 overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
                {/* Title */}
                <div className="px-4 pt-3.5 pb-3 border-b border-border">
                    <div className="font-semibold text-foreground leading-tight">{tree.tag || tree.hid}</div>
                    <div className="flex items-center gap-2 mt-1">
                        {tree.tag && <span className="font-mono text-xs text-muted-foreground">{tree.hid}</span>}
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                            {tree.treeType}
                        </span>
                    </div>
                </div>

                {/* Species */}
                {(tree.speciesName || tree.commonName) && (
                    <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                            {showSpeciesImage ? (
                                <img
                                    src={speciesImage as string}
                                    alt={tree.speciesName || ''}
                                    className="w-full h-full object-cover"
                                    onError={() => setSpeciesImgError(true)}
                                />
                            ) : (
                                <Trees className="w-5 h-5 text-primary" strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="min-w-0">
                            {tree.speciesName && (
                                <div className="text-sm font-medium italic text-foreground truncate">{tree.speciesName}</div>
                            )}
                            {tree.commonName && (
                                <div className="text-xs text-muted-foreground truncate">{tree.commonName}</div>
                            )}
                            {tree.speciesFamily && (
                                <div className="text-[11px] text-muted-foreground truncate">{tree.speciesFamily}</div>
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

                {/* Coordinates */}
                <div className="px-4 pb-3.5 space-y-3">
                    {coords && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-0.5">
                                <MapPin className="w-3 h-3" /> Coordinates
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-foreground truncate">{coords}</span>
                                <CopyButton value={coords} title="Copy coordinates" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Records — expandable timeline inline */}
                <div className="px-4 pb-4 border-t border-border pt-3">
                    {isLoadingRecords ? (
                        <div className="flex items-center gap-2 py-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs">Loading records...</span>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={onViewRecords}
                                disabled={records.length === 0 || !onViewRecords}
                                className="w-full flex items-center justify-between group py-1 disabled:opacity-40 disabled:cursor-default"
                            >
                                <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    <History className="w-4 h-4 text-muted-foreground" />
                                    Records
                                    <span className="text-muted-foreground font-normal">({records.length})</span>
                                </div>
                                {records.length > 0 && (
                                    <ChevronRight
                                        className={cn(
                                            'w-4 h-4 text-muted-foreground group-hover:text-muted-foreground transition-transform',
                                            showRecords && 'rotate-90',
                                        )}
                                    />
                                )}
                            </button>

                            <AnimatePresence initial={false}>
                                {showRecords && records.length > 0 && (
                                    <motion.ol
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="relative border-l border-border ml-1.5 mt-3 space-y-3 overflow-hidden"
                                    >
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
                                                        <span className="text-xs font-medium text-foreground capitalize">
                                                            {rec.recordType?.replace(/_/g, ' ') || 'Record'}
                                                        </span>
                                                        {rec.recordedAt && (
                                                            <span className="text-[11px] text-muted-foreground">{formatDate(rec.recordedAt)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
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
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">Reason: {rec.statusReason}</div>
                                                    )}
                                                    {rec.notes && (
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">{rec.notes}</div>
                                                    )}
                                                    {rec.recordedByName && (
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">by {rec.recordedByName}</div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </motion.ol>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
const ProjectMap: React.FC<{
    projectId: string;
    token: string;
    /** Optional overlay rendered at the map's top-right (e.g. the live-activity toggle). */
    mapTopRight?: React.ReactNode;
}> = ({ projectId, token, mapTopRight }) => {
    const [interventions, setInterventions] = useState<MapIntervention[]>([]);
    const [trees, setTrees] = useState<MapTree[]>([]);
    const [sites, setSites] = useState<SiteFeatureCollection>({ type: 'FeatureCollection', features: [] });
    const [showSiteBoundaries, setShowSiteBoundaries] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
    const [bounds, setBounds] = useState<ProjectMapBounds | null>(null);
    const [hidSearch, setHidSearch] = useState('');
    const [mapState, setMapState] = useState<MapState>({
        selectedInterventionId: null,
        selectedTreeId: null,
        showTreeDetails: false,
    });
    const hoveredFeatureRef = React.useRef<{ source: string; id: number | string } | null>(null);
    const prevSelectedIdRef = React.useRef<number | null>(null);
    // Whether the right detail pane was already open on the previous selection.
    // Used to decide if camera framing must wait for the open/resize animation.
    const paneWasOpenRef = React.useRef(false);
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
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
                duration: 1000,
                maxZoom: 16,
            });
        } catch { /* ignore */ }
    }, [sites.features]);

    useEffect(() => { loadSites(); }, [loadSites]);

    useEffect(() => {
        if (mapLoaded && bounds && interventions.length > 0) {
            try {
                mapRef.current?.fitBounds(bounds.bounds, {
                    padding: { top: 80, bottom: 80, left: 80, right: 80 },
                    duration: 1500,
                    maxZoom: 15,
                });
            } catch { /* ignore */ }
        }
    }, [mapLoaded, bounds, interventions.length]);

    // Interventions filtered by HID search. The overview already receives only
    // public, approved interventions from the server, so no further filtering.
    const filteredInterventions = useMemo(() => {
        const q = hidSearch.toLowerCase();
        const base = q
            ? interventions.filter(i => i.hid.toLowerCase().includes(q))
            : interventions;
        // Recent first: most recently registered interventions at the top.
        return [...base].sort(
            (a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime(),
        );
    }, [interventions, hidSearch]);

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
        // Camera framing is handled by an effect once the right pane has opened
        // and the map has resized, so the target stays centred in the visible map.
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

    // Frame the selected intervention in the *visible* map. The right detail
    // pane is a grid column, so selecting shrinks the map's span; if we fit
    // before the grid reflows, the target drifts off-centre. When the pane is
    // opening (closed -> open) we wait a beat for the reflow + canvas resize;
    // when it is already open we fit immediately.
    useEffect(() => {
        const map = mapRef.current;
        if (!selectedIntervention) { paneWasOpenRef.current = false; return; }
        if (!map || !mapLoaded) return;
        const wasOpen = paneWasOpenRef.current;
        paneWasOpenRef.current = true;
        const frame = () => {
            try { map.resize(); } catch { /* map not ready */ }
            zoomToIntervention(selectedIntervention, map);
        };
        if (wasOpen) { frame(); return; }
        const t = setTimeout(frame, 90);
        return () => clearTimeout(t);
    }, [mapState.selectedInterventionId, mapLoaded, selectedIntervention]);

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
    const rightPaneOpen = !!detailIntervention;

    // The right detail pane is a grid column, so opening/closing it changes the
    // map's span (and width). maplibre tracks size via ResizeObserver, but nudge
    // a resize after the reflow so the canvas fills cleanly (covers the close
    // case, where the framing effect bails out early).
    useEffect(() => {
        const id = setTimeout(() => {
            try { mapRef.current?.resize(); } catch { /* map not ready */ }
        }, 90);
        return () => clearTimeout(id);
    }, [rightPaneOpen]);

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
            <div className="w-full h-screen flex items-center justify-center bg-muted">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">Unable to load map</h2>
                    <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
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
        // 4-column grid mirroring the stat-card grid above, so the left list and
        // right detail card line up exactly with the stat cards. Left = 1 col,
        // map = 2 or 3 cols, right detail = 1 col when open.
        <div className="w-full h-full grid grid-cols-4 grid-rows-1 gap-3">
            {/* Left — interventions list (search + scrollable list) */}
            <InterventionSidebar
                interventions={filteredInterventions}
                selectedId={mapState.selectedInterventionId}
                onSelect={selectIntervention}
                hidSearch={hidSearch}
                onHidSearch={setHidSearch}
                total={interventions.length}
            />

            {/* Center — map */}
            <div className={cn('relative h-full rounded-2xl overflow-hidden', detailIntervention ? 'col-span-2' : 'col-span-3')}>
            <Map
                ref={mapRef}
                onLoad={handleMapLoad}
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
                    'interventions-points-clusters',
                    'interventions-points-circle',
                    'interventions-centroids-circle',
                ]}
                onClick={handleMapClick}
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
                                    ['feature-state', 'hover'], 0.15,
                                    0,
                                ],
                            }}
                        />
                        {/* Semi-transparent fill */}
                        <Layer
                            id="interventions-polygons-fill"
                            type="fill"
                            minzoom={9}
                            paint={{
                                'fill-color': FILL_COLOR,
                                'fill-opacity': [
                                    'case',
                                    ['feature-state', 'selected'], 0.50,
                                    ['feature-state', 'hover'], 0.40,
                                    0.30,
                                ],
                            }}
                        />
                        {/* White border */}
                        <Layer
                            id="interventions-polygons-outline"
                            type="line"
                            minzoom={9}
                            paint={{
                                'line-color': BORDER_COLOR,
                                'line-width': [
                                    'case',
                                    ['feature-state', 'selected'], 3,
                                    ['feature-state', 'hover'], 2.5,
                                    2,
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
                                mapRef.current?.easeTo({ center: [lng, lat], duration: 600 });
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

            {/* Site filter — map control, top-left */}
            {sites.features.length > 0 && (
                <div className="absolute top-3 left-3 z-20">
                    <SiteSelect
                        sites={sites.features}
                        selectedSiteId={selectedSiteId}
                        onSelectSite={handleSelectSite}
                    />
                </div>
            )}

            {/* Map top-right overlay slot (e.g. live-activity toggle) */}
            {mapTopRight && (
                <div className="absolute top-3 right-3 z-20">
                    {mapTopRight}
                </div>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-10 right-3 z-20 flex flex-col gap-1.5">
                {sites.features.length > 0 && (
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setShowSiteBoundaries(v => !v)}
                        className={cn('rounded-full bg-background shadow-md mb-1', showSiteBoundaries ? 'text-amber-500' : 'text-muted-foreground')}
                        title={showSiteBoundaries ? 'Hide site boundaries' : 'Show site boundaries'}
                    >
                        <Layers size={16} strokeWidth={2.5} />
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => mapRef.current?.zoomIn()}
                    className="rounded-full bg-background shadow-md text-foreground"
                    title="Zoom in"
                >
                    <Plus size={17} strokeWidth={2.5} />
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => mapRef.current?.zoomOut()}
                    className="rounded-full bg-background shadow-md text-foreground"
                    title="Zoom out"
                >
                    <Minus size={17} strokeWidth={2.5} />
                </Button>
            </div>
            </div>

            {/* Right — detail pane (a 1-col grid cell, shown when something is
                selected). Drills intervention -> tree -> records in place; the
                map's col-span shrinks to make room. */}
            {detailIntervention && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-1 h-full bg-card text-card-foreground border border-border rounded-2xl overflow-hidden flex flex-col"
                >
                    {selectedTree && mapState.showTreeDetails ? (
                        <TreeTooltip
                            key={selectedTree.id}
                            tree={selectedTree}
                            isLoadingDetail={isLoadingTreeDetail}
                            records={treeRecords?.treeId === selectedTree.id ? treeRecords.records : []}
                            isLoadingRecords={isLoadingRecords || treeRecords?.treeId !== selectedTree.id}
                            showRecords={showTreeRecords}
                            onViewRecords={() => setShowTreeRecords(v => !v)}
                            onClose={() => {
                                setShowTreeRecords(false);
                                setMapState(prev => ({ ...prev, selectedTreeId: null, showTreeDetails: false }));
                            }}
                        />
                    ) : (
                        <InterventionPanel
                            intervention={detailIntervention}
                            trees={detail?.trees ?? trees}
                            isLoading={isLoadingDetail}
                            projectUid={projectId}
                            onClose={() => selectIntervention(null)}
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
                </motion.div>
            )}
        </div>
    );
};

export default ProjectMap;
