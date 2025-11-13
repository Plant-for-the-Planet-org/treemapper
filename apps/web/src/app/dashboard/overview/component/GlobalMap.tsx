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
                <p className="text-sm text-gray-600 capitalize">
                    {intervention.type.replace(/-/g, ' ')}
                </p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {intervention.locationGeometryType || intervention.location.type}
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
                <span>{intervention.totalTreeCount} trees</span>
            </div>
            {intervention.area && (
                <div className="flex items-center gap-2 text-sm">
                    <Ruler size={16} className="text-gray-400" />
                    <span>{intervention.area.toFixed(2)} m²</span>
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
            console.log('Loading interventions for project:', projectId);
            
            const response = await fetchProjectInterventions(projectId, token);
            console.log('Interventions loaded:', response.data.interventions.length);
            
            setInterventions(response.data.interventions);
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
            .filter(i => i.location.type === 'Polygon' || i.location.type === 'MultiPolygon')
            .map(intervention => ({
                type: 'Feature' as const,
                id: intervention.id,
                properties: {
                    id: intervention.id,
                    hid: intervention.hid,
                    type: intervention.type,
                    status: intervention.status,
                    color: getInterventionColor(intervention.type, intervention.status),
                },
                geometry: intervention.location,
            }));

        console.log('Polygon GeoJSON features:', features.length);
        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [interventions]);

    // Debug information
    useEffect(() => {
        if (interventions.length > 0) {
            console.log('=== INTERVENTIONS DEBUG ===');
            console.log('Total interventions:', interventions.length);
            console.log('Bounds:', bounds);
            console.log('Polygon features:', polygonGeoJSON.features.length);
            console.log('All intervention locations:', interventions.map(i => ({
                hid: i.hid,
                type: i.locationGeometryType,
                coords: getMarkerPosition(i)
            })));
            console.log('=========================');
        }
    }, [interventions, bounds, polygonGeoJSON]);

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
                interactiveLayerIds={['interventions-polygons-fill', 'interventions-polygons-outline']}
                onClick={handlePolygonClick}
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
                {/* Polygon/MultiPolygon Interventions as Layers */}
                {polygonGeoJSON.features.length > 0 && (
                    <Source
                        id="interventions-polygons"
                        type="geojson"
                        data={polygonGeoJSON}
                    >
                        {/* Polygon fill layer - INCREASED OPACITY */}
                        <Layer
                            id="interventions-polygons-fill"
                            type="fill"
                            paint={{
                                'fill-color': ['get', 'color'],
                                'fill-opacity': [
                                    'case',
                                    ['==', ['get', 'id'], mapState.selectedInterventionId || -1],
                                    0.6, // Increased from 0.5
                                    0.4  // Increased from 0.3
                                ]
                            }}
                        />
                        {/* Polygon outline layer - INCREASED WIDTH */}
                        <Layer
                            id="interventions-polygons-outline"
                            type="line"
                            paint={{
                                'line-color': ['get', 'color'],
                                'line-width': [
                                    'case',
                                    ['==', ['get', 'id'], mapState.selectedInterventionId || -1],
                                    4, // Increased from 3
                                    3  // Increased from 2
                                ],
                                'line-opacity': 0.9 // Increased from 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Intervention Markers - for all interventions */}
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
                    <div>Polygons: {polygonGeoJSON.features.length}</div>
                    <div>Bounds: {bounds ? `[${bounds.center[0].toFixed(2)}, ${bounds.center[1].toFixed(2)}]` : 'None'}</div>
                    <div>Map Ready: {mapRef ? 'Yes' : 'No'}</div>
                </div>
            )}
        </div>
    );
};

export default ProjectMap;