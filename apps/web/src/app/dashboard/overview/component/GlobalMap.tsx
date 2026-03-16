import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trees,
    MapPin,
    Activity,
    Calendar,
    Ruler,
    Heart,
    AlertCircle,
    Wifi,
    RefreshCw,
    Loader2,
    X
} from 'lucide-react';
import * as turf from '@turf/turf';
import { getAllMapInterevntions } from '@shared-core/fetchApi/api.fetch';

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
        if (!geometry || !geometry.type || !geometry.coordinates) {
            return false;
        }
        switch (geometry.type) {
            case 'Point':
                return Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length === 2 &&
                    typeof geometry.coordinates[0] === 'number' &&
                    typeof geometry.coordinates[1] === 'number' &&
                    Math.abs(geometry.coordinates[0]) <= 180 &&
                    Math.abs(geometry.coordinates[1]) <= 90;
            case 'Polygon':
                return Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length > 0 &&
                    Array.isArray(geometry.coordinates[0]) &&
                    geometry.coordinates[0].length >= 4;
            case 'MultiPolygon':
                return Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length > 0 &&
                    geometry.coordinates.every((polygon: any) =>
                        Array.isArray(polygon) && polygon.length > 0
                    );
            default:
                return false;
        }
    } catch {
        return false;
    }
};

const getInterventionColor = (type: string, status: string): string => {
    const colors = {
        'single-tree-registration': '#10b981',
        'multi-tree-registration': '#10b981',
        'direct-seeding': '#10b981',
        'enrichment-planting': '#059669',
        'maintenance': '#0891b2',
        'monitoring': '#7c3aed',
        'removal-invasive-species': '#dc2626',
        default: '#6b7280',
    };
    const baseColor = colors[type as keyof typeof colors] || colors.default;
    return status === 'completed' || status === 'active' ? baseColor : baseColor;
};

const getTreeStatusColor = (status: string): string => {
    const colors = {
        alive: '#10b981',
        dead: '#dc2626',
        sick: '#f59e0b',
        unknown: '#6b7280',
        removed: '#374151',
    };
    return colors[status as keyof typeof colors] || colors.unknown;
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
        // Handle Point geometry
        if (intervention.location.type === 'Point') {
            return intervention.location.coordinates as [number, number];
        }
        
        // Use centroid if available
        if (intervention.centroid) {
            return intervention.centroid.coordinates as [number, number];
        }
        
        // Calculate centroid for polygon geometries
        const centroid = turf.centroid(intervention.location as any);
        return centroid.geometry.coordinates as [number, number];
    } catch (error) {
        console.warn('Failed to get marker position for intervention:', intervention.hid, error);
        return [0, 0];
    }
};

const calculateBounds = (interventions: MapIntervention[]): ProjectMapBounds => {
    try {
        if (interventions.length === 0) {
            return {
                bounds: [-180, -85, 180, 85],
                center: [0, 0],
            };
        }

        const validInterventions = interventions.filter(i => 
            validateGeoJSONGeometry(i.location)
        );

        if (validInterventions.length === 0) {
            return {
                bounds: [-180, -85, 180, 85],
                center: [0, 0],
            };
        }

        // Get all coordinates for bounds calculation
        let allCoords: number[][] = [];
        
        validInterventions.forEach(intervention => {
            if (intervention.location.type === 'Point') {
                allCoords.push(intervention.location.coordinates as number[]);
            } else {
                // For polygons, use centroid
                try {
                    const centroid = turf.centroid(intervention.location as any);
                    allCoords.push(centroid.geometry.coordinates);
                } catch (error) {
                    console.warn('Failed to calculate centroid for intervention:', intervention.hid);
                }
            }
        });

        if (allCoords.length === 0) {
            return {
                bounds: [-180, -85, 180, 85],
                center: [0, 0],
            };
        }

        // Calculate bounds from coordinates
        const lngs = allCoords.map(coord => coord[0]);
        const lats = allCoords.map(coord => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        // Add small padding
        const lngPadding = (maxLng - minLng) * 0.1 || 0.01;
        const latPadding = (maxLat - minLat) * 0.1 || 0.01;

        return {
            bounds: [
                minLng - lngPadding,
                minLat - latPadding,
                maxLng + lngPadding,
                maxLat + latPadding
            ],
            center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        };
    } catch (error) {
        console.warn('Failed to calculate bounds:', error);
        return {
            bounds: [-180, -85, 180, 85],
            center: [0, 0],
        };
    }
};

// ==================== API FUNCTIONS ====================
const fetchProjectInterventions = async (projectId: string, token: string): Promise<ApiResponse<ProjectMapResponse>> => {
    try {
        const response = await getAllMapInterevntions(token, projectId);

        // Handle the nested data structure from API response
        const apiData = response.data?.data || response.data;
        const rawInterventions = apiData?.interventions || [];
        const apiBounds = apiData?.bounds;

        console.log('Raw API response:', response);
        console.log('Extracted interventions:', rawInterventions.length);

        // Process interventions - add locationGeometryType if missing
        const processedInterventions = rawInterventions.map((intervention: any) => ({
            ...intervention,
            locationGeometryType: intervention.locationGeometryType || intervention.location?.type || 'Point'
        }));

        // Validate geometries
        const validInterventions = processedInterventions.filter((intervention: MapIntervention) => {
            const isValid = validateGeoJSONGeometry(intervention.location);
            if (!isValid) {
                console.warn(`Invalid geometry for intervention ${intervention.hid}:`, intervention.location);
            }
            return isValid;
        });

        console.log('Valid interventions loaded:', validInterventions.length);
        console.log('Sample intervention:', validInterventions[0]);

        // Use API bounds if available, otherwise calculate
        let bounds: ProjectMapBounds;
        if (apiBounds && apiBounds.bounds && apiBounds.center) {
            bounds = apiBounds;
            console.log('Using API bounds:', bounds);
        } else {
            bounds = calculateBounds(validInterventions);
            console.log('Calculated bounds:', bounds);
        }

        return {
            success: true,
            data: {
                interventions: validInterventions,
                bounds: bounds,
                totalInterventions: validInterventions.length,
            },
        };
    } catch (error: any) {
        console.error('Error fetching interventions:', error);
        throw {
            type: 'network',
            message: 'Failed to connect to server',
            details: error.message,
            recoverable: true,
        };
    }
};

const fetchInterventionTrees = async (interventionId: number): Promise<ApiResponse<InterventionTreesResponse>> => {
    try {
        const response = await fetch(`/api/interventions/${interventionId}/trees`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error fetching trees:', error);
        throw {
            type: 'network',
            message: 'Failed to load tree data',
            details: error.message,
            recoverable: true,
        };
    }
};

// ==================== COMPONENTS ====================
// Filter panel for map controls
const FilterPanel: React.FC<{
    types: string[];
    statuses: string[];
    activeTypes: Set<string>;
    activeStatuses: Set<string>;
    showPolygons: boolean;
    showPoints: boolean;
    showHints: boolean;
    onToggleType: (type: string) => void;
    onToggleStatus: (status: string) => void;
    onTogglePolygons: () => void;
    onTogglePoints: () => void;
    onToggleHints: () => void;
}> = ({ types, statuses, activeTypes, activeStatuses, showPolygons, showPoints, showHints, onToggleType, onToggleStatus, onTogglePolygons, onTogglePoints, onToggleHints }) => {
    return (
        <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-lg p-3 w-64 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-800">Map Filters</h4>
                <span className="text-xs text-gray-500">{types.length} types</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Types</div>
                    {types.map(t => (
                        <label key={t} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={activeTypes.has(t)}
                                onChange={() => onToggleType(t)}
                                className="form-checkbox"
                            />
                            <span className="capitalize">{t.replace(/-/g, ' ')}</span>
                        </label>
                    ))}
                </div>
                <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Status</div>
                    {statuses.map(s => (
                        <label key={s} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={activeStatuses.has(s)}
                                onChange={() => onToggleStatus(s)}
                                className="form-checkbox"
                            />
                            <span className="capitalize">{s}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-100 mt-2 pt-2 text-sm space-y-2">
                <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Show polygon fills</span>
                    <input type="checkbox" checked={showPolygons} onChange={onTogglePolygons} />
                </label>
                <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Show point markers</span>
                    <input type="checkbox" checked={showPoints} onChange={onTogglePoints} />
                </label>
                <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Show polygon hints (low zoom)</span>
                    <input type="checkbox" checked={showHints} onChange={onToggleHints} />
                </label>
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
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50
               bg-white rounded-lg shadow-xl border border-red-200 max-w-md"
    >
        <div className="p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">Map Error</h3>
                    <p className="text-sm text-gray-600 mb-3">{error.message}</p>
                    <div className="flex gap-2">
                        {error.recoverable && onRetry && (
                            <button
                                onClick={onRetry}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm
                                 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                            </button>
                        )}
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

const LoadingDisplay: React.FC<{ message?: string }> = ({ message = "Loading map..." }) => (
    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-40">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600">{message}</p>
        </div>
    </div>
);

const InterventionMarker: React.FC<{
    intervention: MapIntervention;
    isSelected: boolean;
    isHovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}> = ({ intervention, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
    const color = getInterventionColor(intervention.type, intervention.status);
    const size = isSelected ? 28 : isHovered ? 24 : 20; // Increased sizes for better visibility
    const [lng, lat] = getMarkerPosition(intervention);

    // Don't render if coordinates are invalid
    if (!lng || !lat || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        console.warn(`Invalid coordinates for intervention ${intervention.hid}:`, lng, lat);
        return null;
    }

    return (
        <Marker
            longitude={lng}
            latitude={lat}
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                onClick();
            }}
        >
            <motion.div
                className="cursor-pointer relative"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                animate={{ scale: isSelected ? 1.2 : isHovered ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ zIndex: isSelected ? 1000 : isHovered ? 999 : 10 }}
            >
                <div
                    className={`rounded-full border-3 border-white shadow-lg ${
                        isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                    }`}
                    style={{
                        backgroundColor: color,
                        width: size,
                        height: size,
                    }}
                />

                {(intervention.locationGeometryType === 'Polygon' ||
                  intervention.locationGeometryType === 'MultiPolygon') && (
                    <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center shadow-md"
                        title={`${intervention.locationGeometryType} geometry`}
                    >
                        <div className="w-2 h-2 bg-gray-600 rounded-sm"></div>
                    </div>
                )}

                {isHovered && !isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 left-1/2 transform -translate-x-1/2
                               bg-gray-900 text-white text-xs px-2 py-1 rounded
                               whitespace-nowrap z-10 shadow-lg"
                    >
                        {intervention.hid} - {intervention.type.replace(/-/g, ' ')}
                    </motion.div>
                )}
            </motion.div>
        </Marker>
    );
};

const TreeMarker: React.FC<{
    tree: MapTree;
    isSelected: boolean;
    onClick: () => void;
}> = ({ tree, isSelected, onClick }) => {
    const color = getTreeStatusColor(tree.status);
    const [lng, lat] = tree.location.coordinates as [number, number];

    if (!lng || !lat || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        return null;
    }

    return (
        <Marker longitude={lng} latitude={lat} onClick={onClick}>
            <motion.div
                className="cursor-pointer"
                animate={{ scale: isSelected ? 1.3 : 1 }}
                transition={{ duration: 0.2 }}
            >
                <Trees
                    size={isSelected ? 20 : 16}
                    color={color}
                    fill={color}
                    className={`drop-shadow-sm ${
                        isSelected ? 'ring-2 ring-blue-500 ring-offset-1 rounded' : ''
                    }`}
                />
            </motion.div>
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
    const centroidText = React.useMemo(() => {
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
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl 
                   border border-gray-200 z-50 max-h-[75vh] overflow-y-auto"
        >
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{intervention.hid}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {intervention.type.replace(/-/g, ' ')}
                            </span>
                            {(() => {
                                const statusClass = intervention.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                                return (
                                    <span className={`text-xs px-2 py-0.5 rounded ${statusClass}`}>
                                        {intervention.status}
                                    </span>
                                );
                            })()}
                            <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
                                {intervention.locationGeometryType || intervention.location.type}
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onZoomTo?.(intervention)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            title="Zoom to intervention"
                        >
                            Zoom
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-gray-400" />
                        <div>
                            <div className="text-xs text-gray-500">Start</div>
                            <div className="font-medium">{formatDate(intervention.interventionStartDate)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <div>
                            <div className="text-xs text-gray-500">Registered</div>
                            <div className="font-medium">{formatDate(intervention.registrationDate)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Trees size={14} className="text-gray-400" />
                        <div>
                            <div className="text-xs text-gray-500">Total Trees</div>
                            <div className="font-medium">{intervention.totalTreeCount ? intervention.totalTreeCount.toLocaleString() : 0}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Ruler size={14} className="text-gray-400" />
                        <div>
                            <div className="text-xs text-gray-500">Area</div>
                            <div className="font-medium">{intervention.area ? `${intervention.area.toFixed(2)} m²` : '—'}</div>
                        </div>
                    </div>

                    <div className="col-span-2">
                        <div className="text-xs text-gray-500">Description</div>
                        <p className="text-sm text-gray-700 mt-1">{intervention.description || 'No description provided.'}</p>
                    </div>

                    {intervention.image && (
                        <div className="col-span-2">
                            <div className="text-xs text-gray-500">Image</div>
                            <img src={intervention.image} alt={intervention.hid} className="mt-2 w-full h-40 object-cover rounded" />
                        </div>
                    )}

                    <div className="col-span-2 flex items-center justify-between gap-2 mt-2">
                        <div className="text-sm text-gray-600">
                            Sample trees: <span className="font-medium">{intervention.totalSampleTreeCount ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onLoadTrees?.(intervention.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                                {isLoadingTrees ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Trees'}
                            </button>
                            <div className="text-xs text-gray-500">Loaded: {treesCount}</div>
                        </div>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <div>UID: <span className="text-gray-700 font-mono text-xs">{intervention.uid}</span></div>
                        <div>HID: <span className="text-gray-700 font-mono text-xs">{intervention.hid}</span></div>
                        <div>Geometry Type: <span className="text-gray-700">{intervention.locationGeometryType || intervention.location.type}</span></div>
                        <div className="mt-1">Centroid: <span className="text-gray-700">{centroidText}</span></div>
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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="absolute top-4 right-4 w-72 bg-white rounded-lg shadow-xl 
               border border-gray-200 z-30"
    >
        <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                    {tree.tag || tree.hid}
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            {tree.speciesName && (
                <p className="text-sm text-gray-600">{tree.speciesName}</p>
            )}
        </div>
        <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-gray-400" />
                <span className="capitalize font-medium">{tree.status}</span>
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTreeStatusColor(tree.status) }}
                />
            </div>
            {tree.currentHeight && (
                <div className="flex items-center gap-2 text-sm">
                    <Ruler size={16} className="text-gray-400" />
                    <span>Height: {tree.currentHeight}cm</span>
                </div>
            )}
            {tree.currentHealthScore && (
                <div className="flex items-center gap-2 text-sm">
                    <Heart size={16} className="text-gray-400" />
                    <span>Health: {tree.currentHealthScore}/100</span>
                </div>
            )}
        </div>
    </motion.div>
);

const MapLegend: React.FC<{
    selectedIntervention?: MapIntervention;
    treeCount: number;
}> = ({ selectedIntervention, treeCount }) => (
    <div className="absolute bottom-[23%] left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-100 p-3 max-w-[280px] z-20">
        <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            <h4 className="font-medium text-gray-800 text-sm">Legend</h4>
        </div>
        
        <div className="space-y-2">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-emerald-500/20"></div>
                    <span className="text-xs text-gray-700">Active Interventions</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 ring-1 ring-emerald-300/30"></div>
                    <span className="text-xs text-gray-700">Planned Interventions</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white ring-offset-1 ring-offset-emerald-500/20"></div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-gray-500 rounded-sm"></div>
                    </div>
                    <span className="text-xs text-gray-700">Polygon Areas</span>
                </div>
            </div>
            
            <div className="border-t border-gray-100 my-2"></div>
            
            <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                    <Trees size={12} className="text-emerald-500" strokeWidth={2.5} />
                    <span className="text-xs text-gray-700">Healthy Trees</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <Trees size={12} className="text-amber-500" strokeWidth={2.5} />
                    <span className="text-xs text-gray-700">Sick Trees</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <Trees size={12} className="text-red-500" strokeWidth={2.5} />
                    <span className="text-xs text-gray-700">Dead Trees</span>
                </div>
            </div>
        </div>
    </div>
);

const MapStats: React.FC<{
    interventions: MapIntervention[];
    selectedIntervention?: MapIntervention;
    treeCount: number;
}> = ({ interventions, selectedIntervention, treeCount }) => (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-48 z-20">
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Interventions:</span>
                <span className="font-semibold">{interventions.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Trees:</span>
                <span className="font-semibold">
                    {interventions.reduce((sum, i) => sum + i.totalTreeCount, 0).toLocaleString()}
                </span>
            </div>
        </div>
    </div>
);

// ==================== MAIN COMPONENT ====================
const ProjectMap: React.FC<{ projectId: string, token: string }> = ({ projectId, token }) => {
    const [interventions, setInterventions] = useState<MapIntervention[]>([]);
    const [trees, setTrees] = useState<MapTree[]>([]);
    const [bounds, setBounds] = useState<ProjectMapBounds | null>(null);
    const [filters, setFilters] = useState<{
        types: Set<string>;
        statuses: Set<string>;
        showPolygons: boolean;
        showPoints: boolean;
        showHints: boolean;
    }>({
        types: new Set(),
        statuses: new Set(),
        showPolygons: true,
        showPoints: true,
        showHints: true,
    });
    const [mapState, setMapState] = useState<MapState>({
        selectedInterventionId: null,
        selectedTreeId: null,
        isLoadingTrees: false,
        showTreeDetails: false,
    });
    const hoveredFeatureRef = React.useRef<{ source: string; id: number | string } | null>(null);
    const prevSelectedIdRef = React.useRef<number | null>(null);
    const [mapRef, setMapRef] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<MapError | null>(null);

    const loadInterventions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('Loading interventions for project:', projectId);
            
            const response = await fetchProjectInterventions(projectId, token);
            console.log('Interventions loaded:', response.data.interventions.length);
            
            const loaded = response.data.interventions;
            setInterventions(loaded);
            // initialize filters with available types/statuses if empty
            setFilters(prev => {
                if (prev.types.size === 0 && prev.statuses.size === 0) {
                    const types = new Set(loaded.map((i: MapIntervention) => i.type));
                    const statuses = new Set(loaded.map((i: MapIntervention) => i.status));
                    return {
                        ...prev,
                        types,
                        statuses,
                    };
                }
                return prev;
            });
            setBounds(response.data.bounds);
        } catch (error: any) {
            console.error('Failed to load interventions:', error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => {
        loadInterventions();
    }, [loadInterventions]);

    // Fit map to bounds when interventions load - FIXED VERSION
    useEffect(() => {
        if (mapRef && bounds && interventions.length > 0) {
            try {
                console.log('Fitting map to bounds:', bounds);
                console.log('Interventions to show:', interventions.length);

                // Use a longer delay to ensure map is fully initialized
                setTimeout(() => {
                    try {
                        mapRef.fitBounds(bounds.bounds, {
                            padding: { top: 100, bottom: 100, left: 400, right: 300 },
                            duration: 2000,
                            maxZoom: 15, // Reduced from 16 to prevent zooming too close
                        });
                        console.log('Map bounds fitted successfully');
                    } catch (err) {
                        console.warn('Failed to fit bounds:', err);
                    }
                }, 500); // Increased delay
            } catch (error) {
                console.warn('Failed to fit bounds:', error);
            }
        }
    }, [mapRef, bounds, interventions.length]);

    const handleInterventionClick = useCallback(async (intervention: MapIntervention) => {
        console.log('Intervention clicked:', intervention.hid);
        
        if (mapState.selectedInterventionId === intervention.id) {
            setMapState(prev => ({
                ...prev,
                selectedInterventionId: null,
                selectedTreeId: null,
                showTreeDetails: false,
            }));
            setTrees([]);
            // clear previously selected feature state
            try {
                const prev = prevSelectedIdRef.current;
                if (prev && mapRef) {
                    mapRef.setFeatureState({ source: 'interventions-points', id: prev }, { selected: false });
                    mapRef.setFeatureState({ source: 'interventions-polygons', id: prev }, { selected: false });
                }
                prevSelectedIdRef.current = null;
            } catch (err) {
                console.warn('Failed to clear selected feature state:', err);
            }
            return;
        }

        setMapState(prev => ({
            ...prev,
            selectedInterventionId: intervention.id,
            isLoadingTrees: false,
            selectedTreeId: null,
            showTreeDetails: false,
        }));

        // Zoom to the intervention
        try {
            const [lng, lat] = getMarkerPosition(intervention);
            if (lng && lat) {
                mapRef?.flyTo({
                    center: [lng, lat],
                    zoom: 16,
                    duration: 1000,
                });
            }
        } catch (error) {
            console.warn('Failed to zoom to intervention:', error);
        }
        // set feature-state for selection (clear previous)
        try {
            const prev = prevSelectedIdRef.current;
            if (prev && mapRef) {
                mapRef.setFeatureState({ source: 'interventions-points', id: prev }, { selected: false });
                mapRef.setFeatureState({ source: 'interventions-polygons', id: prev }, { selected: false });
            }
            if (mapRef) {
                mapRef.setFeatureState({ source: 'interventions-points', id: intervention.id }, { selected: true });
                mapRef.setFeatureState({ source: 'interventions-polygons', id: intervention.id }, { selected: true });
            }
            prevSelectedIdRef.current = intervention.id;
        } catch (err) {
            console.warn('Failed to set selected feature state:', err);
        }
    }, [mapRef, mapState.selectedInterventionId]);

    const handleTreeClick = useCallback((tree: MapTree) => {
        setMapState(prev => ({
            ...prev,
            selectedTreeId: tree.id,
            showTreeDetails: true,
        }));
    }, []);

    const handlePolygonClick = useCallback((event: any) => {
        const feature = event.features?.[0];
        if (feature && feature.properties?.id) {
            const interventionId = feature.properties.id;
            const intervention = interventions.find(i => i.id === interventionId);
            if (intervention) {
                handleInterventionClick(intervention);
            }
        }
    }, [interventions, handleInterventionClick]);

    const handleRetry = useCallback(() => {
        loadInterventions();
    }, [loadInterventions]);

    const handleErrorDismiss = useCallback(() => {
        setError(null);
    }, []);

    const selectedIntervention = useMemo(() =>
        interventions.find(i => i.id === mapState.selectedInterventionId),
        [interventions, mapState.selectedInterventionId]
    );

    const selectedTree = useMemo(() =>
        trees.find(t => t.id === mapState.selectedTreeId),
        [trees, mapState.selectedTreeId]
    );

    // Create GeoJSON for polygon/multipolygon interventions
    const polygonGeoJSON = useMemo(() => {
        const features = interventions
            .filter(i => (i.location.type === 'Polygon' || i.location.type === 'MultiPolygon')
                && filters.types.has(i.type)
                && filters.statuses.has(i.status)
            )
            .map(intervention => ({
                type: 'Feature' as const,
                id: intervention.id,
                properties: {
                    id: intervention.id,
                    hid: intervention.hid,
                    type: intervention.type,
                    status: intervention.status,
                    color: getInterventionColor(intervention.type, intervention.status),
                    isPolygon: true,
                },
                geometry: intervention.location,
            }));

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [interventions, filters]);

    // Create GeoJSON for point interventions
    const pointGeoJSON = useMemo(() => {
        const features = interventions
            .filter(i => i.location.type === 'Point'
                && filters.types.has(i.type)
                && filters.statuses.has(i.status)
            )
            .map(intervention => ({
                type: 'Feature' as const,
                id: intervention.id,
                properties: {
                    id: intervention.id,
                    hid: intervention.hid,
                    type: intervention.type,
                    status: intervention.status,
                    color: getInterventionColor(intervention.type, intervention.status),
                    isPolygon: false,
                },
                geometry: intervention.location,
            }));

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [interventions, filters]);

    // Centroid hints for polygon areas at low zoom
    const polygonCentroidGeoJSON = useMemo(() => {
        const features = interventions
            .filter(i => (i.location.type === 'Polygon' || i.location.type === 'MultiPolygon'))
            .filter(i => filters.types.has(i.type) && filters.statuses.has(i.status))
            .map(intervention => {
                const centroid = intervention.centroid ? intervention.centroid : turf.centroid(intervention.location as any).geometry;
                const coords = (centroid.type === 'Point' ? centroid.coordinates : (centroid as any).coordinates);
                return {
                    type: 'Feature' as const,
                    id: intervention.id,
                    properties: {
                        id: intervention.id,
                        hid: intervention.hid,
                        type: intervention.type,
                        status: intervention.status,
                        color: getInterventionColor(intervention.type, intervention.status),
                        isPolygonCentroid: true,
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: coords,
                    } as GeoJSON.Point,
                };
            });

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [interventions, filters]);

    // Derived lists for filter panel
    const allTypes = useMemo(() => Array.from(new Set(interventions.map(i => i.type))), [interventions]);
    const allStatuses = useMemo(() => Array.from(new Set(interventions.map(i => i.status))), [interventions]);

    // Handlers for filter toggles
    const toggleType = useCallback((type: string) => {
        setFilters(prev => {
            const newTypes = new Set(prev.types);
            if (newTypes.has(type)) newTypes.delete(type);
            else newTypes.add(type);
            return { ...prev, types: newTypes };
        });
    }, []);

    const toggleStatus = useCallback((status: string) => {
        setFilters(prev => {
            const newStatuses = new Set(prev.statuses);
            if (newStatuses.has(status)) newStatuses.delete(status);
            else newStatuses.add(status);
            return { ...prev, statuses: newStatuses };
        });
    }, []);

    const togglePolygons = useCallback(() => {
        setFilters(prev => ({ ...prev, showPolygons: !prev.showPolygons }));
    }, []);

    const togglePoints = useCallback(() => {
        setFilters(prev => ({ ...prev, showPoints: !prev.showPoints }));
    }, []);

    const toggleHints = useCallback(() => {
        setFilters(prev => ({ ...prev, showHints: !prev.showHints }));
    }, []);

    // Debug information
    useEffect(() => {
        if (interventions.length > 0) {
            console.log('=== INTERVENTIONS DEBUG ===');
            console.log('Total interventions:', interventions.length);
            console.log('Point features:', pointGeoJSON.features.length);
            console.log('Polygon features:', polygonGeoJSON.features.length);
            console.log('Polygon centroids:', polygonCentroidGeoJSON.features.length);
            console.log('Bounds:', bounds);
            console.log('All intervention locations:', interventions.map(i => ({
                hid: i.hid,
                type: i.locationGeometryType || i.location.type,
                coords: i.location.type === 'Point' ? i.location.coordinates : 'polygon'
            })));
            console.log('=========================');
        }
    }, [interventions, bounds, pointGeoJSON, polygonGeoJSON, polygonCentroidGeoJSON]);

    if (isLoading) {
        return (
            <div className="relative w-full h-screen">
                <LoadingDisplay message="Loading project map..." />
            </div>
        );
    }

    if (error && !error.recoverable) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Map</h2>
                    <p className="text-gray-600 mb-4">{error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <Map
                ref={setMapRef}
                mapStyle={{
                    "version": 8,
                    "metadata": "Tree Intervention Map",
                    "name": "Tree Map",
                    "bearing": 0,
                    "pitch": 0,
                    "sources": {
                        "imagery": {
                            "type": "raster",
                            "tiles": [
                                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            ],
                            "tileSize": 256,
                            "minzoom": 0,
                            "maxzoom": 19
                        }
                    },
                    "layers": [
                        {
                            "id": "imagery",
                            "type": "raster",
                            "source": "imagery",
                            "minzoom": 0,
                            "maxzoom": 19,
                            "layout": { "visibility": "visible" }
                        }
                    ]
                }}
                initialViewState={{
                    longitude: bounds?.center[0] || 0,
                    latitude: bounds?.center[1] || 0,
                    zoom: 5, // Changed from 2 to 5 for better initial visibility
                }}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={[
                    'interventions-polygons-fill',
                    'interventions-polygons-outline',
                    'interventions-points-circle',
                    'interventions-polygons-hint'
                ]}
                onClick={handlePolygonClick}
                onMouseMove={(event) => {
                    try {
                        const feature = event.features?.[0];
                        const map = mapRef;
                        const prev = hoveredFeatureRef.current;

                        if (feature && (feature.properties?.id || feature.id != null)) {
                            const id = feature.properties?.id ?? feature.id;
                            const source = feature.source || feature.layer?.source;

                            // if previous hovered is different, clear it
                            if (prev && (prev.id !== id || prev.source !== source)) {
                                map?.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                                hoveredFeatureRef.current = null;
                            }

                            // set new hovered state if different
                            if (!prev || prev.id !== id || prev.source !== source) {
                                map?.setFeatureState({ source, id }, { hover: true });
                                hoveredFeatureRef.current = { source, id };
                            }
                        } else if (prev) {
                            // clear previous if no feature
                            map?.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                            hoveredFeatureRef.current = null;
                        }
                    } catch (err) {
                        console.warn('Error handling mouse move hover state:', err);
                    }
                }}
                onMouseLeave={() => {
                    try {
                        const prev = hoveredFeatureRef.current;
                        if (prev && mapRef) {
                            mapRef.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                            hoveredFeatureRef.current = null;
                        }
                    } catch (err) {
                        console.warn('Error clearing hover state:', err);
                    }
                }}
                onError={(error) => {
                    console.error('Map error:', error);
                    setError({
                        type: 'mapbox',
                        message: 'Failed to load map tiles',
                        details: error,
                        recoverable: true,
                    });
                }}
            >
                {/* Polygon/MultiPolygon Interventions as Layers (visible at higher zoom) */}
                {filters.showPolygons && polygonGeoJSON.features.length > 0 && (
                    <Source
                        id="interventions-polygons"
                        type="geojson"
                        data={polygonGeoJSON}
                    >
                        {/* Polygon fill layer - only at closer zooms */}
                        <Layer
                            id="interventions-polygons-fill"
                            type="fill"
                            minzoom={11}
                            paint={{
                                'fill-color': ['get', 'color'],
                                'fill-opacity': [
                                    'case',
                                    ['feature-state', 'selected'],
                                    0.65,
                                    0.35
                                ]
                            }}
                        />
                        {/* Polygon outline layer */}
                        <Layer
                            id="interventions-polygons-outline"
                            type="line"
                            minzoom={11}
                            paint={{
                                'line-color': ['get', 'color'],
                                'line-width': [
                                    'case',
                                    ['feature-state', 'selected'],
                                    4,
                                    2
                                ],
                                'line-opacity': 0.95
                            }}
                        />
                    </Source>
                )}

                {/* Polygon centroid hints - visible at low zoom to indicate polygon presence */}
                {filters.showHints && polygonCentroidGeoJSON.features.length > 0 && (
                    <Source
                        id="interventions-polygons-centroids"
                        type="geojson"
                        data={polygonCentroidGeoJSON}
                    >
                        <Layer
                            id="interventions-polygons-hint"
                            type="circle"
                            maxzoom={11}
                            paint={{
                                'circle-color': ['concat', ['get', 'color'], '80'], // add alpha-ish hint
                                'circle-radius': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    0, 6,
                                    6, 10,
                                    10, 14
                                ],
                                'circle-opacity': 0.7,
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#ffffff'
                            }}
                        />
                    </Source>
                )}

                {/* Point Interventions as Circle Layers */}
                {filters.showPoints && pointGeoJSON.features.length > 0 && (
                    <Source
                        id="interventions-points"
                        type="geojson"
                        data={pointGeoJSON}
                    >
                        {/* Point circle layer */}
                        <Layer
                            id="interventions-points-circle"
                            type="circle"
                            paint={{
                                'circle-color': ['get', 'color'],
                                'circle-radius': [
                                    'case',
                                    ['feature-state', 'selected'],
                                    14, // Selected size
                                    ['feature-state', 'hover'],
                                    12, // Hovered size
                                    10  // Default size
                                ],
                                'circle-opacity': 1,
                                'circle-stroke-width': [
                                    'case',
                                    ['feature-state', 'selected'],
                                    4, // Selected stroke
                                    2  // Default stroke
                                ],
                                'circle-stroke-color': '#ffffff',
                                'circle-stroke-opacity': 1
                            }}
                        />
                        {/* Selection ring for selected points */}
                        <Layer
                            id="interventions-points-selected-ring"
                            type="circle"
                            paint={{
                                'circle-radius': 18,
                                'circle-color': 'transparent',
                                'circle-stroke-width': 3,
                                'circle-stroke-color': '#3b82f6',
                                'circle-stroke-opacity': [
                                    'case',
                                    ['feature-state', 'selected'],
                                    1,
                                    0
                                ]
                            }}
                        />
                    </Source>
                )}

                {/* Trees Markers */}
                {trees.map((tree) => (
                    <TreeMarker
                        key={tree.id}
                        tree={tree}
                        isSelected={mapState.selectedTreeId === tree.id}
                        onClick={() => handleTreeClick(tree)}
                    />
                ))}
            </Map>

            {/* Error Display */}
            <AnimatePresence>
                {error && error.recoverable && (
                    <ErrorDisplay
                        error={error}
                        onRetry={handleRetry}
                        onDismiss={handleErrorDismiss}
                    />
                )}
            </AnimatePresence>

            {/* Intervention Details Panel */}
            <AnimatePresence>
                {selectedIntervention && (
                    <InterventionPanel
                        intervention={selectedIntervention}
                        onClose={() => {
                            setMapState(prev => ({
                                ...prev,
                                selectedInterventionId: null,
                                selectedTreeId: null,
                                showTreeDetails: false,
                            }));
                            setTrees([]);
                        }}
                        onLoadTrees={async (id: number) => {
                            try {
                                setMapState(prev => ({ ...prev, isLoadingTrees: true }));
                                const res = await fetchInterventionTrees(id);
                                const treesData = res?.data?.trees ?? (res as any)?.trees ?? [];
                                setTrees(Array.isArray(treesData) ? treesData : []);
                            } catch (err) {
                                console.warn('Failed to load trees for intervention:', err);
                            } finally {
                                setMapState(prev => ({ ...prev, isLoadingTrees: false }));
                            }
                        }}
                        isLoadingTrees={mapState.isLoadingTrees}
                        onZoomTo={(intervention) => {
                            try {
                                const [lng, lat] = getMarkerPosition(intervention);
                                if (lng && lat) {
                                    mapRef?.flyTo({ center: [lng, lat], zoom: 16, duration: 800 });
                                }
                            } catch (err) {
                                console.warn('Failed to zoom to intervention from panel:', err);
                            }
                        }}
                        treesCount={trees.length}
                    />
                )}
            </AnimatePresence>

            {/* Tree Details Tooltip */}
            <AnimatePresence>
                {selectedTree && mapState.showTreeDetails && (
                    <TreeTooltip
                        tree={selectedTree}
                        onClose={() => setMapState(prev => ({
                            ...prev,
                            selectedTreeId: null,
                            showTreeDetails: false,
                        }))}
                    />
                )}
            </AnimatePresence>

            {/* Loading Trees Indicator */}
            {mapState.isLoadingTrees && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 z-20">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                    <span className="text-sm text-gray-600">Loading trees...</span>
                </div>
            )}

            {/* Filter Panel */}
            <FilterPanel
                types={allTypes}
                statuses={allStatuses}
                activeTypes={filters.types}
                activeStatuses={filters.statuses}
                showPolygons={filters.showPolygons}
                showPoints={filters.showPoints}
                showHints={filters.showHints}
                onToggleType={toggleType}
                onToggleStatus={toggleStatus}
                onTogglePolygons={togglePolygons}
                onTogglePoints={togglePoints}
                onToggleHints={toggleHints}
            />

            {/* Map Legend */}
            <MapLegend
                selectedIntervention={selectedIntervention}
                treeCount={trees.length}
            />

            {/* Map Stats */}
            <MapStats
                interventions={interventions}
                selectedIntervention={selectedIntervention}
                treeCount={trees.length}
            />

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
                    <div>Interventions: {interventions.length}</div>
                    <div>Points: {pointGeoJSON.features.length}</div>
                    <div>Polygons: {polygonGeoJSON.features.length}</div>
                    <div>Bounds: {bounds ? `[${bounds.center[0].toFixed(2)}, ${bounds.center[1].toFixed(2)}]` : 'None'}</div>
                    <div>Map Ready: {mapRef ? 'Yes' : 'No'}</div>
                </div>
            )}
        </div>
    );
};

export default ProjectMap;