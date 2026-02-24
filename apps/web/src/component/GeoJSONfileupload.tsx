"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import * as turf from "@turf/turf";
import * as tj from "@mapbox/togeojson";

// Constants
const MAX_AREA_HECTARES = 25000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface GeoJSONUploadProps {
  onGeoJSONChange: (geoJson: any | null) => void;
  className?: string;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  fileName?: string;
  area?: number;
  geometryType?: string;
}

export default function GeoJSONUpload({
  onGeoJSONChange,
  className = "",
}: GeoJSONUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });

  const resetUploadState = () => {
    setUploadState({ status: "idle", message: "" });
    onGeoJSONChange(null);
  };

  // Validate that the geometry is a Polygon or MultiPolygon
  const validateGeometryType = (
    geoJson: any
  ): { valid: boolean; type: string | null; error?: string } => {
    let geometryType: string | null = null;

    // Handle different GeoJSON structures
    if (geoJson.type === "FeatureCollection" && geoJson.features?.length > 0) {
      const types = new Set<string>();
      for (const feature of geoJson.features) {
        if (feature.geometry?.type) {
          types.add(feature.geometry.type);
        }
      }

      if (types.size === 0) {
        return { valid: false, type: null, error: "No valid geometries found in the file." };
      }

      if (types.size > 1) {
        // Check if it's just Polygon and MultiPolygon mix (allowed)
        const allowedTypes = new Set(["Polygon", "MultiPolygon"]);
        const hasOnlyAllowed = [...types].every((t) => allowedTypes.has(t));
        if (!hasOnlyAllowed) {
          return {
            valid: false,
            type: null,
            error: `Mixed geometry types found (${[...types].join(", ")}). Only Polygon and MultiPolygon are allowed.`,
          };
        }
      }

      geometryType = [...types][0];
    } else if (geoJson.type === "Feature" && geoJson.geometry?.type) {
      geometryType = geoJson.geometry.type;
    } else if (geoJson.type === "Polygon" || geoJson.type === "MultiPolygon") {
      geometryType = geoJson.type;
    }

    if (!geometryType) {
      return { valid: false, type: null, error: "Could not determine geometry type." };
    }

    // Only allow Polygon and MultiPolygon
    if (geometryType !== "Polygon" && geometryType !== "MultiPolygon") {
      const typeMessage =
        geometryType === "Point"
          ? "Point geometries are not supported."
          : geometryType === "LineString"
            ? "LineString geometries are not supported."
            : `${geometryType} geometries are not supported.`;

      return {
        valid: false,
        type: geometryType,
        error: `${typeMessage} Only Polygon and MultiPolygon are allowed.`,
      };
    }

    return { valid: true, type: geometryType };
  };

  // Calculate total area of all polygons
  const calculateTotalArea = (geoJson: any): number => {
    try {
      const areaInSquareMeters = turf.area(geoJson);
      return areaInSquareMeters / 10000; // Convert to hectares
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  };

  // Strip altitude (Z) coordinates — KML files include altitude which can
  // cause PostGIS to reject the geometry when the column expects 2D geometry.
  const strip2DCoordinates = (coords: any[]): any[] => {
    if (!Array.isArray(coords)) return coords;
    if (typeof coords[0] === "number") {
      return coords.slice(0, 2); // [lng, lat, alt?] → [lng, lat]
    }
    return coords.map(strip2DCoordinates);
  };

  const stripAltitudeFromGeometry = (geometry: any): any => {
    if (!geometry || !geometry.coordinates) return geometry;
    return { ...geometry, coordinates: strip2DCoordinates(geometry.coordinates) };
  };

  const stripAltitudeFromGeoJSON = (geoJson: any): any => {
    if (geoJson.type === "FeatureCollection") {
      return {
        ...geoJson,
        features: geoJson.features.map((f: any) => ({
          ...f,
          geometry: stripAltitudeFromGeometry(f.geometry),
        })),
      };
    }
    if (geoJson.type === "Feature") {
      return { ...geoJson, geometry: stripAltitudeFromGeometry(geoJson.geometry) };
    }
    return stripAltitudeFromGeometry(geoJson);
  };

  // Normalize GeoJSON to FeatureCollection with single feature
  const normalizeToFeatureCollection = (geoJson: any): any => {
    // Already a FeatureCollection
    if (geoJson.type === "FeatureCollection") {
      // If multiple features, merge them into a single MultiPolygon
      if (geoJson.features.length > 1) {
        const polygons: any[] = [];

        for (const feature of geoJson.features) {
          if (feature.geometry.type === "Polygon") {
            polygons.push(feature.geometry.coordinates);
          } else if (feature.geometry.type === "MultiPolygon") {
            polygons.push(...feature.geometry.coordinates);
          }
        }

        return {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "MultiPolygon",
                coordinates: polygons,
              },
            },
          ],
        };
      }
      return geoJson;
    }

    // Single Feature
    if (geoJson.type === "Feature") {
      return {
        type: "FeatureCollection",
        features: [geoJson],
      };
    }

    // Raw Geometry (Polygon or MultiPolygon)
    if (geoJson.type === "Polygon" || geoJson.type === "MultiPolygon") {
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: geoJson,
          },
        ],
      };
    }

    return null;
  };

  const processGeoJSON = (geoJson: any, fileName: string) => {
    // Validate geometry type
    const validation = validateGeometryType(geoJson);
    if (!validation.valid) {
      setUploadState({
        status: "error",
        message: validation.error || "Invalid geometry type.",
        fileName,
      });
      return;
    }

    // Normalize to FeatureCollection
    const normalized = normalizeToFeatureCollection(geoJson);
    if (!normalized) {
      setUploadState({
        status: "error",
        message: "Could not process the file structure.",
        fileName,
      });
      return;
    }

    // Calculate and validate area
    const areaInHectares = calculateTotalArea(normalized);

    if (areaInHectares > MAX_AREA_HECTARES) {
      setUploadState({
        status: "error",
        message: `Area exceeds maximum limit of ${MAX_AREA_HECTARES.toLocaleString()} hectares. Current area: ${areaInHectares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`,
        fileName,
        area: Math.round(areaInHectares * 100) / 100,
      });
      return;
    }

    // Success
    const roundedArea = Math.round(areaInHectares * 100) / 100;
    setUploadState({
      status: "success",
      message: `File processed successfully.`,
      fileName,
      area: roundedArea,
      geometryType: validation.type || undefined,
    });
    onGeoJSONChange(normalized);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf(".") + 1)
      .toLowerCase();

    setUploadState({
      status: "uploading",
      message: "Processing file...",
      fileName: file.name,
    });

    const reader = new FileReader();

    reader.onabort = () => {
      setUploadState({
        status: "error",
        message: "File reading was aborted.",
        fileName: file.name,
      });
    };

    reader.onerror = () => {
      setUploadState({
        status: "error",
        message: "File reading failed.",
        fileName: file.name,
      });
    };

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const content = event.target?.result as string;

        if (fileExtension === "kml") {
          // Parse KML
          const dom = new DOMParser().parseFromString(content, "text/xml");

          // Check for parsing errors
          const parseError = dom.querySelector("parsererror");
          if (parseError) {
            setUploadState({
              status: "error",
              message: "Invalid KML file format.",
              fileName: file.name,
            });
            return;
          }

          const rawGeoJson = tj.kml(dom);
          const geoJson = stripAltitudeFromGeoJSON(rawGeoJson);
          processGeoJSON(geoJson, file.name);
        } else if (fileExtension === "geojson" || fileExtension === "json") {
          // Parse GeoJSON
          const geoJson = JSON.parse(content);
          processGeoJSON(geoJson, file.name);
        } else {
          setUploadState({
            status: "error",
            message: "Unsupported file format. Please use .kml, .geojson, or .json files.",
            fileName: file.name,
          });
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setUploadState({
          status: "error",
          message: fileExtension === "kml"
            ? "Invalid KML file format."
            : "Invalid JSON format.",
          fileName: file.name,
        });
      }
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: {
        "application/vnd.google-earth.kml+xml": [".kml"],
        "application/geo+json": [".geojson"],
        "application/json": [".json"],
      },
      onDrop,
      multiple: false,
      maxSize: MAX_FILE_SIZE,
      onDropRejected: (rejectedFiles) => {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((error) => error.code === "file-too-large")) {
          setUploadState({
            status: "error",
            message: "File size must be less than 10MB.",
            fileName: rejection.file.name,
          });
        } else {
          setUploadState({
            status: "error",
            message: "File type not supported. Please use .kml, .geojson, or .json files.",
            fileName: rejection.file.name,
          });
        }
      },
    });

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case "uploading":
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Upload className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (isDragReject) return "border-red-300 bg-red-50";
    if (isDragActive) return "border-green-300 bg-green-50";

    switch (uploadState.status) {
      case "uploading":
        return "border-blue-300 bg-blue-50";
      case "success":
        return "border-green-300 bg-green-50";
      case "error":
        return "border-red-300 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100";
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl px-8 py-4 text-center cursor-pointer
            transition-all duration-200 ${getStatusColor()}
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-3">
            {/* Status Icon */}
            <div className="flex justify-center">{getStatusIcon()}</div>

            {/* Main Content */}
            <div className="space-y-2">
              {uploadState.status === "idle" && (
                <>
                  <h3 className="text-md font-semibold text-gray-900">
                    {isDragActive
                      ? "Drop your file here"
                      : "Upload polygon file"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Drag & drop or click to select
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports: KML, GeoJSON (Polygon/MultiPolygon only, max {MAX_AREA_HECTARES.toLocaleString()} ha)
                  </p>
                </>
              )}

              {uploadState.status === "uploading" && (
                <>
                  <h3 className="text-md font-semibold text-blue-900">
                    Processing your file...
                  </h3>
                  {uploadState.fileName && (
                    <p className="text-sm text-blue-700">
                      {uploadState.fileName}
                    </p>
                  )}
                </>
              )}

              {uploadState.status === "success" && (
                <>
                  <h3 className="text-md font-semibold text-green-900">
                    File uploaded successfully!
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-green-700 font-medium">
                      {uploadState.fileName}
                    </p>
                    {uploadState.geometryType && (
                      <p className="text-sm text-green-600">
                        Type: {uploadState.geometryType}
                      </p>
                    )}
                    {uploadState.area !== undefined && (
                      <p className="text-sm text-green-600">
                        Area: {uploadState.area.toLocaleString()} hectares
                      </p>
                    )}
                  </div>
                </>
              )}

              {uploadState.status === "error" && (
                <>
                  <h3 className="text-md font-semibold text-red-900">
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
            {uploadState.status !== "idle" &&
              uploadState.status !== "uploading" && (
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUploadState();
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      uploadState.status === "success"
                        ? "text-green-700 bg-green-100 hover:bg-green-200"
                        : "text-red-700 bg-red-100 hover:bg-red-200"
                    }`}
                  >
                    {uploadState.status === "success"
                      ? "Upload Different File"
                      : "Try Again"}
                  </button>
                </div>
              )}
          </div>

          {/* Drag Overlay */}
          {isDragActive && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-10 border-2 border-green-400 border-dashed rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-md font-semibold text-green-700">
                  Drop your file here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to calculate area from GeoJSON
export const calculateFarmArea = (geoJson: any): number => {
  if (!geoJson) return 0;

  try {
    const areaInSquareMeters = turf.area(geoJson);
    return Math.round((areaInSquareMeters / 10000) * 100) / 100;
  } catch {
    return 0;
  }
};

// Utility function to get center coordinates from GeoJSON
export const getLatLonFromGeoJSON = (
  geoJson: any
): { latitude: number; longitude: number } => {
  if (!geoJson) {
    return { latitude: 0, longitude: 0 };
  }

  try {
    const centroid = turf.centroid(geoJson);
    const [longitude, latitude] = centroid.geometry.coordinates;
    return { latitude, longitude };
  } catch {
    return { latitude: 0, longitude: 0 };
  }
};
