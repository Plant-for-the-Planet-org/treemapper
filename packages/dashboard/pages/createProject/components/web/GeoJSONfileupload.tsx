"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2, MapPin, Info } from "lucide-react";

// Mock dependencies - replace with your actual imports
const tj = {
  kml: (dom: any) => ({ type: "FeatureCollection", features: [] })
};
const gjv = {
  isGeoJSONObject: (obj: any) => true,
  isFeatureCollection: (obj: any) => true
};
const flatten = (geoJson: any) => geoJson;
const turf = {
  area: (geoJson: any) => 10000,
  centroid: (geoJson: any) => ({ geometry: { coordinates: [0, 0] } })
};

interface GeoJSONUploadProps {
    onGeoJSONChange: (geoJson: any | null) => void;
    maxAreaHa?: number;
    className?: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
  fileName?: string;
  area?: number;
}

export default function GeoJSONUpload({
    onGeoJSONChange,
    maxAreaHa = 1000,
    className = ""
}: GeoJSONUploadProps) {
    const [uploadState, setUploadState] = useState<UploadState>({
      status: 'idle',
      message: ''
    });
    const [geoJson, setGeoJson] = useState<any | null>(null);

    const resetUploadState = () => {
        setUploadState({ status: 'idle', message: '' });
        setGeoJson(null);
        onGeoJSONChange(null);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const fileType = file.name.substring(
            file.name.lastIndexOf(".") + 1,
            file.name.length
        ).toLowerCase();

        setUploadState({
            status: 'uploading',
            message: 'Processing file...',
            fileName: file.name
        });

        const reader = new FileReader();
        reader.onabort = () => {
            setUploadState({
                status: 'error',
                message: 'File reading was aborted',
                fileName: file.name
            });
        };
        
        reader.onerror = () => {
            setUploadState({
                status: 'error',
                message: 'File reading failed',
                fileName: file.name
            });
        };

        if (fileType === "kml") {
            reader.readAsText(file);
            reader.onload = (event: any) => {
                try {
                    const dom = new DOMParser().parseFromString(
                        event.target.result,
                        "text/xml"
                    );
                    const geo = tj.kml(dom);
                    normalizeGeoJson(geo, file.name);
                } catch (error) {
                    console.error("Error parsing KML:", error);
                    setUploadState({
                        status: 'error',
                        message: 'Invalid KML file format',
                        fileName: file.name
                    });
                }
            };
        } else if (fileType === "geojson" || fileType === "json") {
            reader.readAsText(file);
            reader.onload = (event: any) => {
                try {
                    const geo = JSON.parse(event.target.result);
                    normalizeGeoJson(geo, file.name);
                } catch (error) {
                    console.error("Error parsing GeoJSON:", error);
                    setUploadState({
                        status: 'error',
                        message: 'Invalid JSON format',
                        fileName: file.name
                    });
                }
            };
        } else {
            setUploadState({
                status: 'error',
                message: 'Unsupported file format. Please use KML or GeoJSON files.',
                fileName: file.name
            });
        }
    }, [maxAreaHa]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        accept: {
            "application/vnd.google-earth.kml+xml": [".kml"],
            "application/vnd.geo+json": [".geojson"],
            "application/json": [".json"]
        },
        onDrop,
        multiple: false,
        maxSize: 10 * 1024 * 1024, // 10MB
        onDropRejected: (rejectedFiles) => {
            const rejection = rejectedFiles[0];
            if (rejection.errors.some(error => error.code === 'file-too-large')) {
                setUploadState({
                    status: 'error',
                    message: 'File size must be less than 10MB',
                    fileName: rejection.file.name
                });
            } else {
                setUploadState({
                    status: 'error',
                    message: 'File type not supported',
                    fileName: rejection.file.name
                });
            }
        }
    });

    const normalizeGeoJson = (geoJson: any, fileName: string) => {
        console.log("SDc",geoJson)
        if (gjv.isGeoJSONObject(geoJson) && geoJson.features?.length > 0) {
            try {
                // Convert LineString to Polygon
                const convertLineStringToPolygon = (geoJson: any) => {
                    const convertedGeoJSON = JSON.parse(JSON.stringify(geoJson));

                    convertedGeoJSON.features = convertedGeoJSON.features.map((feature: any) => {
                        if (feature.geometry?.type === "LineString") {
                            const coordinates = feature.geometry.coordinates;

                            if (
                                coordinates.length > 0 &&
                                (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                                    coordinates[0][1] !== coordinates[coordinates.length - 1][1])
                            ) {
                                coordinates.push(coordinates[0]);
                            }

                            feature.geometry.type = "Polygon";
                            feature.geometry.coordinates = [coordinates];
                        }
                        return feature;
                    });

                    return convertedGeoJSON;
                };

                const flattened = flatten(geoJson);
                const geoJsonWithPolygons = convertLineStringToPolygon(flattened);

                const polygons = geoJsonWithPolygons.features.filter(
                    (feature: any) => feature.geometry?.type === "Polygon"
                );

                if (polygons.length > 0) {
                    const featureCollection = {
                        type: "FeatureCollection",
                        features: [polygons[0]],
                    };

                    if (gjv.isFeatureCollection(featureCollection)) {
                        const area = turf.area(featureCollection);
                        const areaInHa = area / 10000;

                        if (areaInHa > maxAreaHa) {
                            const roundedArea = Math.round(areaInHa * 100) / 100;
                            setUploadState({
                                status: 'error',
                                message: `Area is too large (${roundedArea} ha). Maximum allowed: ${maxAreaHa} ha`,
                                fileName,
                                area: roundedArea
                            });
                            return;
                        }

                        const roundedArea = Math.round(areaInHa * 100) / 100;
                        setGeoJson(featureCollection);
                        setUploadState({
                            status: 'success',
                            message: `File processed successfully. Area: ${roundedArea} ha`,
                            fileName,
                            area: roundedArea
                        });
                        onGeoJSONChange(featureCollection);
                    } else {
                        setUploadState({
                            status: 'error',
                            message: 'Invalid geometry format. Only polygons and multipolygons are supported.',
                            fileName
                        });
                    }
                } else {
                    setUploadState({
                        status: 'error',
                        message: 'No valid polygons found in the file',
                        fileName
                    });
                }
            } catch (error) {
                console.error("Error processing GeoJSON:", error);
                setUploadState({
                    status: 'error',
                    message: 'An error occurred while processing the file',
                    fileName
                });
            }
        } else {
            setUploadState({
                status: 'error',
                message: 'Invalid file format. Only polygons and multipolygons are supported.',
                fileName
            });
        }
    };

    const getStatusIcon = () => {
        switch (uploadState.status) {
            case 'uploading':
                return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'error':
                return <XCircle className="h-6 w-6 text-red-500" />;
            default:
                return <Upload className="h-6 w-6 text-gray-400" />;
        }
    };

    const getStatusColor = () => {
        if (isDragReject) return 'border-red-300 bg-red-50';
        if (isDragActive) return 'border-green-300 bg-green-50';
        
        switch (uploadState.status) {
            case 'uploading':
                return 'border-blue-300 bg-blue-50';
            case 'success':
                return 'border-green-300 bg-green-50';
            case 'error':
                return 'border-red-300 bg-red-50';
            default:
                return 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100';
        }
    };

    return (
        <div className={className}>
            <div className="space-y-4">
                {/* Info Section */}
                {/* <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">
                            Upload Location File
                        </p>
                        <p className="text-blue-700">
                            Upload a KML or GeoJSON file to define your project area. 
                            Maximum area allowed: <span className="font-semibold">{maxAreaHa} hectares</span>
                        </p>
                    </div>
                </div> */}

                {/* Upload Area */}
                <div
                    {...getRootProps()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
                        transition-all duration-200 ${getStatusColor()}
                    `}
                >
                    <input {...getInputProps()} />
                    
                    <div className="space-y-4">
                        {/* Status Icon */}
                        <div className="flex justify-center">
                            {getStatusIcon()}
                        </div>

                        {/* Main Content */}
                        <div className="space-y-2">
                            {uploadState.status === 'idle' && (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {isDragActive ? 'Drop your file here' : 'Choose file or drag & drop'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Supported formats: KML, GeoJSON (max 10MB)
                                    </p>
                                </>
                            )}

                            {uploadState.status === 'uploading' && (
                                <>
                                    <h3 className="text-lg font-semibold text-blue-900">
                                        Processing your file...
                                    </h3>
                                    {uploadState.fileName && (
                                        <p className="text-sm text-blue-700">
                                            {uploadState.fileName}
                                        </p>
                                    )}
                                </>
                            )}

                            {uploadState.status === 'success' && (
                                <>
                                    <h3 className="text-lg font-semibold text-green-900">
                                        File uploaded successfully!
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-sm text-green-700 font-medium">
                                            {uploadState.fileName}
                                        </p>
                                        {uploadState.area && (
                                            <p className="text-sm text-green-600">
                                                Area: {uploadState.area} hectares
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {uploadState.status === 'error' && (
                                <>
                                    <h3 className="text-lg font-semibold text-red-900">
                                        Upload failed
                                    </h3>
                                    <div className="space-y-1">
                                        {uploadState.fileName && (
                                            <p className="text-sm text-red-700 font-medium">
                                                {uploadState.fileName}
                                            </p>
                                        )}
                                        <p className="text-sm text-red-600">
                                            {uploadState.message}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {uploadState.status !== 'idle' && uploadState.status !== 'uploading' && (
                            <div className="flex justify-center gap-3 pt-2">
                                {uploadState.status === 'success' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetUploadState();
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                    >
                                        Upload Different File
                                    </button>
                                )}
                                
                                {uploadState.status === 'error' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetUploadState();
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Drag Overlay */}
                    {isDragActive && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-10 border-2 border-green-400 border-dashed rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <Upload className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                <p className="text-lg font-semibold text-green-700">
                                    Drop your file here
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* File Format Help */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                            <p className="font-medium text-gray-700">KML Files</p>
                            <p className="text-gray-500">Google Earth format</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                            <p className="font-medium text-gray-700">GeoJSON Files</p>
                            <p className="text-gray-500">Standard geo format</p>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

// Utility functions
export const calculateFarmArea = (geoJson: any): number => {
    const area = turf.area(geoJson);
    const areaInHa = area / 10000;
    return Math.round(areaInHa * 100) / 100;
};

export const getLatLonFromGeoJSON = (geoJson: any): { latitude: number; longitude: number } => {
    const centroid = turf.centroid(geoJson);
    const [longitude, latitude] = centroid.geometry.coordinates;
    return { latitude, longitude };
};