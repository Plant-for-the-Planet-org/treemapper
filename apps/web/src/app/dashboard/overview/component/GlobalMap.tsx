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

// Import maplibre-gl CSS - make sure this is in your _app.js or layout
// import 'maplibre-gl/dist/maplibre-gl.css';

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
    locationGeometryType: 'Point' | 'Polygon' | 'MultiPolygon';
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
    hoveredInterventionId: number | null;
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
        'direct-seeding': '#10b981',
        'enrichment-planting': '#059669',
        'maintenance': '#0891b2',
        'monitoring': '#7c3aed',
        'removal-invasive-species': '#dc2626',
        default: '#6b7280',
    };

    const baseColor = colors[type as keyof typeof colors] || colors.default;
    return status === 'completed' ? baseColor : `${baseColor}CC`;
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
        if (intervention.locationGeometryType === 'Point') {
            return intervention.location.coordinates as [number, number];
        }

        // Use centroid if available, otherwise calculate with Turf
        if (intervention.centroid) {
            return intervention.centroid.coordinates as [number, number];
        }

        // Fallback: calculate centroid with Turf
        const centroid = turf.centroid(intervention.location as any);
        return centroid.geometry.coordinates as [number, number];
    } catch (error) {
        console.warn('Failed to get marker position:', error);
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

        // Create a feature collection for Turf
        const features = validInterventions.map(intervention =>
            turf.feature(intervention.location as any)
        );

        const collection = turf.featureCollection(features);
        const bbox = turf.bbox(collection);

        return {
            bounds: bbox as [number, number, number, number],
            center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
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

        // Validate response structure
        if (!Array.isArray(response.data.interventions)) {
            throw {
                type: 'api',
                message: 'Invalid response format from server',
                recoverable: false,
            };
        }

        // Validate geometries
        const validInterventions = response.data.interventions.filter((intervention: MapIntervention) => {
            const isValid = validateGeoJSONGeometry(intervention.location);
            if (!isValid) {
                console.warn(`Invalid geometry for intervention ${intervention.hid}`);
            }
            return isValid;
        });

        return {
            ...response,
            data: {
                ...response.data,
                interventions: validInterventions,
            },
        };
    } catch (error: any) {
        if (error.type) throw error;

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
            const errorData = await response.json().catch(() => ({}));
            throw {
                type: response.status === 404 ? 'api' : 'api',
                message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                recoverable: response.status >= 500,
            };
        }

        const data = await response.json();

        if (!data.success || !data.data) {
            throw {
                type: 'api',
                message: 'Invalid response format from server',
                recoverable: false,
            };
        }

        // Validate tree geometries
        const validTrees = data.data.trees.filter((tree: MapTree) => {
            const isValid = validateGeoJSONGeometry(tree.location);
            if (!isValid) {
                console.warn(`Invalid geometry for tree ${tree.hid}`);
            }
            return isValid;
        });

        return {
            ...data,
            data: {
                ...data.data,
                trees: validTrees,
            },
        };
    } catch (error: any) {
        if (error.type) throw error;

        throw {
            type: 'network',
            message: 'Failed to load tree data',
            details: error.message,
            recoverable: true,
        };
    }
};

// ==================== ERROR COMPONENTS ====================

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
                    {error.type === 'network' ? (
                        <Wifi className="w-5 h-5 text-red-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                        {error.type === 'network' ? 'Connection Error' :
                            error.type === 'permission' ? 'Access Denied' :
                                error.type === 'mapbox' ? 'Map Error' :
                                    error.type === 'geometry' ? 'Data Error' :
                                        'Something went wrong'}
                    </h3>
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

                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Dismiss
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

const LoadingDisplay: React.FC<{
    message?: string;
}> = ({ message = "Loading map..." }) => (
    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-40">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600">{message}</p>
        </div>
    </div>
);

// ==================== MAP COMPONENTS ====================

const InterventionPolygonLayers: React.FC<{
    interventions: MapIntervention[];
    selectedInterventionId: number | null;
    onInterventionClick: (intervention: MapIntervention) => void;
}> = ({ interventions, selectedInterventionId, onInterventionClick }) => {
    const polygonData = useMemo(() => {
        const polygonFeatures = interventions
            .filter(i => i.locationGeometryType !== 'Point' && validateGeoJSONGeometry(i.location))
            .map(intervention => ({
                type: 'Feature' as const,
                properties: {
                    id: intervention.id,
                    type: intervention.type,
                    status: intervention.status,
                    hid: intervention.hid,
                    color: getInterventionColor(intervention.type, intervention.status),
                },
                geometry: intervention.location,
            }));

        return {
            type: 'FeatureCollection' as const,
            features: polygonFeatures,
        };
    }, [interventions]);

    const handleClick = useCallback((event: any) => {
        const feature = event.features?.[0];
        if (feature?.properties?.id) {
            const intervention = interventions.find(i => i.id === feature.properties.id);
            if (intervention) {
                onInterventionClick(intervention);
            }
        }
    }, [interventions, onInterventionClick]);

    if (polygonData.features.length === 0) return null;

    return (
        <Source id="intervention-polygons" type="geojson" data={polygonData}>
            <Layer
                id="intervention-fill"
                type="fill"
                paint={{
                    'fill-color': [
                        'case',
                        ['==', ['get', 'id'], selectedInterventionId || -1],
                        ['get', 'color'],
                        ['concat', ['get', 'color'], '40'],
                    ],
                    'fill-outline-color': ['get', 'color'],
                }}
                onClick={handleClick}
            />
            <Layer
                id="intervention-border"
                type="line"
                paint={{
                    'line-color': ['get', 'color'],
                    'line-width': [
                        'case',
                        ['==', ['get', 'id'], selectedInterventionId || -1],
                        3,
                        2,
                    ],
                }}
                onClick={handleClick}
            />
        </Source>
    );
};

const InterventionMarker: React.FC<{
    intervention: MapIntervention;
    isSelected: boolean;
    isHovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}> = ({ intervention, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
    const color = getInterventionColor(intervention.type, intervention.status);
    const size = isSelected ? 16 : isHovered ? 12 : 10;
    const [lng, lat] = getMarkerPosition(intervention);

    // Don't render if coordinates are invalid
    if (!lng || !lat || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        return null;
    }

    return (
        <Marker longitude={lng} latitude={lat} onClick={onClick}>
            <motion.div
                className="cursor-pointer relative"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                animate={{ scale: isSelected ? 1.2 : isHovered ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
            >
                <div
                    className={`rounded-full border-2 border-white shadow-lg ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                    style={{
                        backgroundColor: color,
                        width: size,
                        height: size,
                    }}
                />
                {intervention.locationGeometryType !== 'Point' && (
                    <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-300 flex items-center justify-center"
                        title={`${intervention.locationGeometryType} geometry`}
                    >
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-sm"></div>
                    </div>
                )}
                {isHovered && !isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                       bg-gray-900 text-white text-xs px-2 py-1 rounded 
                       whitespace-nowrap z-10"
                    >
                        {intervention.hid} - {intervention.type}
                        {intervention.locationGeometryType !== 'Point' && (
                            <span className="ml-1 text-gray-300">({intervention.locationGeometryType})</span>
                        )}
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

    // Don't render if coordinates are invalid
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
                    className={`drop-shadow-sm ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 rounded' : ''
                        }`}
                />
            </motion.div>
        </Marker>
    );
};

const InterventionPanel: React.FC<{
    intervention: MapIntervention;
    onClose: () => void;
}> = ({ intervention, onClose }) => (
    <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        className="absolute top-4 left-4 w-80 bg-white rounded-lg shadow-xl 
               border border-gray-200 z-30 max-h-96 overflow-y-auto"
    >
        <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{intervention.hid}</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 capitalize">{intervention.type.replace('-', ' ')}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {intervention.locationGeometryType}
                </span>
            </div>
        </div>

        <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-gray-400" />
                <span className="capitalize font-medium">{intervention.status}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span>{formatDate(intervention.interventionStartDate)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <Trees size={16} className="text-gray-400" />
                <span>{intervention.totalTreeCount} trees planted</span>
            </div>

            {intervention.area && (
                <div className="flex items-center gap-2 text-sm">
                    <Ruler size={16} className="text-gray-400" />
                    <span>{intervention.area.toFixed(2)} m²</span>
                </div>
            )}

            {intervention.locationGeometryType !== 'Point' && (
                <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-gray-400" />
                    <span>Area-based intervention</span>
                </div>
            )}

            {intervention.description && (
                <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{intervention.description}</p>
                </div>
            )}
        </div>
    </motion.div>
);

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
            {tree.commonName && (
                <p className="text-xs text-gray-500">{tree.commonName}</p>
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

            {tree.plantingDate && (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span>Planted: {formatDate(tree.plantingDate)}</span>
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
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            <h4 className="font-medium text-gray-800 text-sm">Legend</h4>
        </div>

        {/* Legend Items */}
        <div className="space-y-2">
            {/* Interventions Section */}
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

            {/* Divider */}
            <div className="border-t border-gray-100 my-2"></div>

            {/* Trees Section */}
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

        {/* Selected Intervention Info */}
        {selectedIntervention && (
            <div className="mt-3 pt-2 border-t border-gray-100 bg-gray-50/50 -mx-3 -mb-3 px-3 pb-3 rounded-b-xl">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                        ID: {selectedIntervention.hid}
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                        {treeCount.toLocaleString()} trees
                    </span>
                </div>
            </div>
        )}
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
            {selectedIntervention && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Selected Trees:</span>
                        <span className="font-semibold">{treeCount}</span>
                    </div>
                </div>
            )}
        </div>
    </div>
);

// ==================== MAIN COMPONENT ====================

const ProjectMap: React.FC<{ projectId: string, token: string }> = ({ projectId, token }) => {
    const [interventions, setInterventions] = useState<MapIntervention[]>([]);
    const [trees, setTrees] = useState<MapTree[]>([]);
    const [bounds, setBounds] = useState<ProjectMapBounds | null>(null);
    const [mapState, setMapState] = useState<MapState>({
        selectedInterventionId: null,
        hoveredInterventionId: null,
        selectedTreeId: null,
        isLoadingTrees: false,
        showTreeDetails: false,
    });
    const [mapRef, setMapRef] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<MapError | null>(null);

    const loadInterventions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetchProjectInterventions(projectId, token);
            setInterventions(response.data.interventions);
            setBounds(response.data.bounds);
        } catch (error: any) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => {
        loadInterventions();
    }, [loadInterventions]);

    // Fit map to bounds when interventions load
    useEffect(() => {
        if (mapRef && bounds && interventions.length > 0) {
            try {
                mapRef.fitBounds(bounds.bounds, {
                    padding: 50,
                    duration: 1000,
                });
            } catch (error) {
                console.warn('Failed to fit bounds:', error);
            }
        }
    }, [mapRef, bounds, interventions]);

    // Handle intervention click
    const handleInterventionClick = useCallback(async (intervention: MapIntervention) => {
        if (mapState.selectedInterventionId === intervention.id) {
            // Clicking the same intervention - deselect
            setMapState(prev => ({
                ...prev,
                selectedInterventionId: null,
                selectedTreeId: null,
                showTreeDetails: false,
            }));
            setTrees([]);
            return;
        }

        try {
            setMapState(prev => ({
                ...prev,
                selectedInterventionId: intervention.id,
                isLoadingTrees: true,
                selectedTreeId: null,
                showTreeDetails: false,
            }));

            const response = await fetchInterventionTrees(intervention.id);

            if (response.success) {
                setTrees(response.data.trees);

                // Calculate optimal bounds including intervention and trees
                let zoomBounds = bounds;

                if (response.data.trees.length > 0) {
                    try {
                        // Create features for trees
                        const treeFeatures = response.data.trees.map(tree =>
                            turf.point(tree.location.coordinates)
                        );

                        // Add intervention feature
                        const interventionFeature = turf.feature(intervention.location as any);

                        // Combine all features
                        const allFeatures = turf.featureCollection([
                            interventionFeature,
                            ...treeFeatures
                        ]);

                        const bbox = turf.bbox(allFeatures);

                        // Add buffer to bounds
                        const buffered = turf.bbox(
                            turf.buffer(allFeatures, 0.1, { units: 'kilometers' })
                        );

                        zoomBounds = {
                            bounds: buffered as [number, number, number, number],
                            center: [(buffered[0] + buffered[2]) / 2, (buffered[1] + buffered[3]) / 2],
                        };
                    } catch (error) {
                        console.warn('Failed to calculate combined bounds:', error);
                        // Fallback to intervention bounds
                        const interventionFeature = turf.feature(intervention.location as any);
                        const bbox = turf.bbox(interventionFeature);
                        const buffered = turf.bbox(
                            turf.buffer(interventionFeature, 0.1, { units: 'kilometers' })
                        );

                        zoomBounds = {
                            bounds: buffered as [number, number, number, number],
                            center: [(buffered[0] + buffered[2]) / 2, (buffered[1] + buffered[3]) / 2],
                        };
                    }
                } else {
                    // No trees, just zoom to intervention
                    try {
                        const interventionFeature = turf.feature(intervention.location as any);
                        const bbox = turf.bbox(interventionFeature);
                        const buffered = turf.bbox(
                            turf.buffer(interventionFeature, 0.1, { units: 'kilometers' })
                        );

                        zoomBounds = {
                            bounds: buffered as [number, number, number, number],
                            center: [(buffered[0] + buffered[2]) / 2, (buffered[1] + buffered[3]) / 2],
                        };
                    } catch (error) {
                        console.warn('Failed to calculate intervention bounds:', error);
                    }
                }

                // Zoom to calculated bounds
                if (mapRef && zoomBounds) {
                    try {
                        mapRef.fitBounds(zoomBounds.bounds, {
                            padding: 100,
                            duration: 1000,
                        });
                    } catch (error) {
                        console.warn('Failed to zoom to bounds:', error);
                    }
                }
            }
        } catch (error: any) {
            console.error('Failed to load trees:', error);
            // Don't set global error for tree loading failures
            setMapState(prev => ({
                ...prev,
                selectedInterventionId: intervention.id, // Keep selection
                isLoadingTrees: false,
            }));
        } finally {
            setMapState(prev => ({ ...prev, isLoadingTrees: false }));
        }
    }, [mapRef, mapState.selectedInterventionId, bounds]);

    // Handle tree click
    const handleTreeClick = useCallback((tree: MapTree) => {
        setMapState(prev => ({
            ...prev,
            selectedTreeId: tree.id,
            showTreeDetails: true,
        }));
    }, []);

    // Handle error retry
    const handleRetry = useCallback(() => {
        loadInterventions();
    }, [loadInterventions]);

    // Handle error dismiss
    const handleErrorDismiss = useCallback(() => {
        setError(null);
    }, []);

    // Handle map error
    const handleMapError = useCallback((error: any) => {
        console.error('Map error:', error);
        setError({
            type: 'mapbox',
            message: 'Failed to load map. Please check your internet connection.',
            details: error,
            recoverable: true,
        });
    }, []);

    // Get selected objects
    const selectedIntervention = useMemo(() =>
        interventions.find(i => i.id === mapState.selectedInterventionId),
        [interventions, mapState.selectedInterventionId]
    );

    const selectedTree = useMemo(() =>
        trees.find(t => t.id === mapState.selectedTreeId),
        [trees, mapState.selectedTreeId]
    );

    if (isLoading) {
        return (
            <div className="relative w-full h-screen">
                <LoadingDisplay message="Loading project map..." />
            </div>
        );
    }

    if (error && error.type === 'permission') {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">{error.message}</p>
                    <p className="text-sm text-gray-500">
                        Please contact your administrator if you believe you should have access to this project.
                    </p>
                </div>
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
                    "zoom": 4,
                    "center": [69.3451, 30.3753],
                    "sources": {
                        "imagery": {
                            "type": "raster",
                            "tiles": [
                                "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            ],
                            "tileSize": 256,
                            "minzoom": 0,
                            "maxzoom": 24
                        }
                    },
                    "id": "Imagery",
                    "layers": [
                        {
                            "id": "Imagery",
                            "type": "raster",
                            "source": "imagery",
                            "minzoom": 0,
                            "maxzoom": 24,
                            "layout": { "visibility": "visible" }
                        }
                    ]
                }}
                initialViewState={{
                    longitude: bounds?.center[0] || 0,
                    latitude: bounds?.center[1] || 0,
                    zoom: 2,
                }}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={['intervention-fill', 'intervention-border']}
            >
                {/* Intervention Polygon Layers */}
                <InterventionPolygonLayers
                    interventions={interventions}
                    selectedInterventionId={mapState.selectedInterventionId}
                    onInterventionClick={handleInterventionClick}
                />

                {/* Intervention Markers */}
                {interventions.map((intervention) => (
                    <InterventionMarker
                        key={intervention.id}
                        intervention={intervention}
                        isSelected={mapState.selectedInterventionId === intervention.id}
                        isHovered={mapState.hoveredInterventionId === intervention.id}
                        onClick={() => handleInterventionClick(intervention)}
                        onMouseEnter={() => setMapState(prev => ({
                            ...prev,
                            hoveredInterventionId: intervention.id
                        }))}
                        onMouseLeave={() => setMapState(prev => ({
                            ...prev,
                            hoveredInterventionId: null
                        }))}
                    />
                ))}

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
                    />
                )}
            </AnimatePresence>

            {/* Trees Details Tooltip */}
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
        </div>
    );
};

export default ProjectMap;