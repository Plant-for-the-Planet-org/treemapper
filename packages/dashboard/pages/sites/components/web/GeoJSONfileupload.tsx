"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import tj from "@mapbox/togeojson";
import gjv from "geojson-validation";
import flatten from "geojson-flatten";
import * as turf from "@turf/turf";
import { Loader2Icon } from "lucide-react";

interface GeoJSONUploadProps {
    onGeoJSONChange: (geoJson: any | null) => void;
    maxAreaHa?: number; // Maximum area in hectares (default: 1000 ha)
    className?: string;
}

interface UploadIconProps {
    className?: string;
}



const PassIcon = ({ className = "w-6 h-6 text-green-600" }: UploadIconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
);

export default function GeoJSONUpload({
    onGeoJSONChange,
    maxAreaHa = 1000,
    className = ""
}: GeoJSONUploadProps) {
    const [isUploadingData, setIsUploadingData] = useState(false);
    const [geoJson, setGeoJson] = useState<any | null>(null);
    const [geoJsonError, setGeoJsonError] = useState("");
    const [fileSizeError, setFileSizeError] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setGeoJsonError("");
        setFileSizeError(false);

        acceptedFiles.forEach((file: File) => {
            const reader = new FileReader();
            const fileType = file.name.substring(
                file.name.lastIndexOf(".") + 1,
                file.name.length
            ) || file.name;

            reader.onabort = () => console.log("file reading was aborted");
            reader.onerror = () => console.log("file reading has failed");

            if (fileType === "kml") {
                reader.readAsText(file);
                reader.onload = (event: any) => {
                    try {
                        const dom = new DOMParser().parseFromString(
                            event.target.result,
                            "text/xml"
                        );
                        const geo = tj.kml(dom);
                        normalizeGeoJson(geo);
                    } catch (error) {
                        console.error("Error parsing KML:", error);
                        setGeoJsonError("Error parsing KML file");
                    }
                };
            } else if (fileType === "geojson") {
                reader.readAsText(file);
                reader.onload = (event: any) => {
                    try {
                        const geo = JSON.parse(event.target.result);
                        normalizeGeoJson(geo);
                    } catch (error) {
                        console.error("Error parsing GeoJSON:", error);
                        setGeoJsonError("Error parsing GeoJSON file");
                    }
                };
            }
        });
        setIsUploadingData(false);
    }, [maxAreaHa]);

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            "application/vnd.google-earth.kml+xml": [".kml"],
            "application/vnd.geo+json": [".geojson"],
        },
        onDrop,
        multiple: false,
        onDropAccepted: () => { },
        onFileDialogCancel: () => setIsUploadingData(false),
        onFileDialogOpen: () => setIsUploadingData(true),
    });

    const normalizeGeoJson = (geoJson: any) => {
        if (gjv.isGeoJSONObject(geoJson) && geoJson.features?.length > 0) {
            try {
                // Convert LineString to Polygon
                const convertLineStringToPolygon = (geoJson: any) => {
                    const convertedGeoJSON = JSON.parse(JSON.stringify(geoJson));

                    convertedGeoJSON.features = convertedGeoJSON.features.map((feature: any) => {
                        if (feature.geometry?.type === "LineString") {
                            const coordinates = feature.geometry.coordinates;

                            // Ensure LineString is closed (first point matches the last point)
                            if (
                                coordinates.length > 0 &&
                                (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                                    coordinates[0][1] !== coordinates[coordinates.length - 1][1])
                            ) {
                                // Close the loop by adding the first coordinate at the end
                                coordinates.push(coordinates[0]);
                            }

                            // Convert LineString to Polygon
                            feature.geometry.type = "Polygon";
                            feature.geometry.coordinates = [coordinates]; // Wrap coordinates in an array for Polygon structure

                            console.log("Converted LineString to Polygon:", feature);
                        }

                        return feature;
                    });

                    return convertedGeoJSON;
                };

                // Flatten the GeoJSON
                const flattened = flatten(geoJson);

                // Convert LineStrings to Polygons
                const geoJsonWithPolygons = convertLineStringToPolygon(flattened);

                console.log("GeoJSON after conversion:", geoJsonWithPolygons);

                // Filter out polygons
                const polygons = geoJsonWithPolygons.features.filter(
                    (feature: any) => feature.geometry?.type === "Polygon"
                );

                if (polygons.length > 0) {
                    // Keep only the first polygon
                    const featureCollection = {
                        type: "FeatureCollection",
                        features: [polygons[0]],
                    };

                    // Validate the feature collection
                    if (gjv.isFeatureCollection(featureCollection)) {
                        const area = turf.area(featureCollection);
                        const areaInHa = area / 10000; // Convert to hectares

                        if (areaInHa > maxAreaHa) {
                            const roundedArea = Math.round(areaInHa * 100) / 100;
                            setGeoJsonError(`Area is too large (${roundedArea} ha), max ${maxAreaHa} ha`);
                            return;
                        }

                        // Set the valid GeoJSON
                        const validGeoJson = featureCollection;
                        setGeoJson(validGeoJson);
                        setGeoJsonError("");
                        onGeoJSONChange(validGeoJson);
                    } else {
                        console.error("GeoJSON is invalid after conversion:", featureCollection);
                        setGeoJsonError(
                            "Unsupported file format, only polygons and multipolygons are supported"
                        );
                    }
                } else {
                    setGeoJsonError("No polygons found");
                }
            } catch (error) {
                console.error("Error processing GeoJSON:", error);
                setGeoJsonError("An error occurred while processing the GeoJSON.");
            }
        } else {
            setGeoJsonError(
                "Unsupported file format, only polygons and multiPolygons are supported"
            );
        }
    };
    return (
        <div className={className}>
            <p className="text-sm font-medium text-gray-700 mb-2">Or upload a KML/GeoJSON file instead:</p>
            <div className="flex items-center">
                    {isUploadingData ? (
                        <div className="flex justify-center items-center">
                            <Loader2Icon className="animate-spin h-10 w-10 text-green-600" />
                        </div>) :

                       ( <>
                            < label htmlFor="locationFile" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                                Choose File
                            </label>
                            <input
                                id="locationFile"
                                name="locationFile"
                                type="file"
                                accept=".kml,.geojson,.json"
                                className="sr-only"
                                {...getInputProps()}
                            />
                            <span className="ml-3 text-sm text-gray-500" id="file-name">
                            </span>
                            <p className="mt-2 text-xs text-gray-400">
                                Note: Accepted formats: KML, GeoJSON
                            </p>
                        </>)}
            {
                geoJsonError && (
                    <div className="text-red-700 text-lg font-semibold mt-2">
                        {geoJsonError}
                    </div>
                )
            }

            {
                fileSizeError && (
                    <div className="text-red-700 text-lg font-semibold mt-2">
                        File size must be less than 10MB
                    </div>
                )
            }
        </div >
        </div>
    );
}

// Utility functions you can export if needed elsewhere
export const calculateFarmArea = (geoJson: any): number => {
    const area = turf.area(geoJson);
    const areaInHa = area / 10000; // Convert to hectares
    return Math.round(areaInHa * 100) / 100;
};

export const getLatLonFromGeoJSON = (geoJson: any): { latitude: number; longitude: number } => {
    const centroid = turf.centroid(geoJson);
    const [longitude, latitude] = centroid.geometry.coordinates;
    return { latitude, longitude };
};