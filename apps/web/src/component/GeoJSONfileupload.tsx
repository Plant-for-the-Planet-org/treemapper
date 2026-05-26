"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import * as turf from "@turf/turf";
import * as tj from "@mapbox/togeojson";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface GeoJSONUploadProps {
  onGeoJSONChange: (geoJson: any | null) => void;
  className?: string;
  allowedGeometryTypes?: string[];
  maxAreaHa?: number;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  fileName?: string;
  geometryType?: string;
}

export default function GeoJSONUpload({
  onGeoJSONChange,
  className = "",
  allowedGeometryTypes = ["Point"],
}: GeoJSONUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });

  const resetUploadState = () => {
    setUploadState({ status: "idle", message: "" });
    onGeoJSONChange(null);
  };

  const validateGeometryType = (
    geoJson: any
  ): { valid: boolean; type: string | null; error?: string } => {
    let geometryType: string | null = null;

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
        return {
          valid: false,
          type: null,
          error: `Mixed geometry types found (${[...types].join(", ")}). Only ${allowedGeometryTypes.join(" or ")} is allowed.`,
        };
      }

      geometryType = [...types][0];
    } else if (geoJson.type === "Feature" && geoJson.geometry?.type) {
      geometryType = geoJson.geometry.type;
    } else if (geoJson.type) {
      geometryType = geoJson.type;
    }

    if (!geometryType) {
      return { valid: false, type: null, error: "Could not determine geometry type." };
    }

    if (!allowedGeometryTypes.includes(geometryType)) {
      return {
        valid: false,
        type: geometryType,
        error: `${geometryType} geometry is not supported. Only ${allowedGeometryTypes.join(" or ")} geometry is allowed.`,
      };
    }

    return { valid: true, type: geometryType };
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

  // Normalize GeoJSON to a single Point feature
  const normalizeToFeatureCollection = (geoJson: any): any => {
    // Already a FeatureCollection — use first feature
    if (geoJson.type === "FeatureCollection") {
      if (!geoJson.features?.length) return null;
      return {
        type: "FeatureCollection",
        features: [geoJson.features[0]],
      };
    }

    // Single Feature
    if (geoJson.type === "Feature") {
      return {
        type: "FeatureCollection",
        features: [geoJson],
      };
    }

    // Raw Point geometry
    if (geoJson.type === "Point") {
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

    // Success
    setUploadState({
      status: "success",
      message: `File processed successfully.`,
      fileName,
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
        return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-primary" />;
      case "error":
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Upload className="h-6 w-6 text-muted-foreground/60" />;
    }
  };

  const getStatusColor = () => {
    if (isDragReject) return "border-destructive/50 bg-destructive/5";
    if (isDragActive) return "border-primary/50 bg-primary/5";

    switch (uploadState.status) {
      case "uploading":
        return "border-primary/30 bg-primary/5";
      case "success":
        return "border-primary/50 bg-primary/5";
      case "error":
        return "border-destructive/50 bg-destructive/5";
      default:
        return "border-border bg-muted/50 hover:border-border hover:bg-muted";
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-xl px-8 py-4 text-center cursor-pointer transition-all duration-200",
            getStatusColor()
          )}
        >
          <input {...getInputProps()} />

          <div className="space-y-3">
            <div className="flex justify-center">{getStatusIcon()}</div>

            <div className="space-y-2">
              {uploadState.status === "idle" && (
                <>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isDragActive ? "Drop your file here" : "Upload location file"}
                  </h3>
                  <p className="text-sm text-muted-foreground">Drag & drop or click to select</p>
                  <p className="text-xs text-muted-foreground/60">
                    Supports: KML, GeoJSON ({allowedGeometryTypes.join(", ")} geometry)
                  </p>
                </>
              )}

              {uploadState.status === "uploading" && (
                <>
                  <h3 className="text-sm font-semibold text-foreground">Processing your file...</h3>
                  {uploadState.fileName && (
                    <p className="text-sm text-muted-foreground">{uploadState.fileName}</p>
                  )}
                </>
              )}

              {uploadState.status === "success" && (
                <>
                  <h3 className="text-sm font-semibold text-primary">File uploaded successfully</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground font-medium">{uploadState.fileName}</p>
                    {uploadState.geometryType && (
                      <p className="text-xs text-muted-foreground">Type: {uploadState.geometryType}</p>
                    )}
                  </div>
                </>
              )}

              {uploadState.status === "error" && (
                <>
                  <h3 className="text-sm font-semibold text-destructive">Upload failed</h3>
                  <div className="space-y-1">
                    {uploadState.fileName && (
                      <p className="text-sm text-foreground font-medium">{uploadState.fileName}</p>
                    )}
                    <p className="text-sm text-destructive/80">{uploadState.message}</p>
                  </div>
                </>
              )}
            </div>

            {uploadState.status !== "idle" && uploadState.status !== "uploading" && (
              <div className="flex justify-center pt-2">
                <Button
                  size="sm"
                  variant={uploadState.status === "error" ? "destructive" : "outline"}
                  onClick={(e) => { e.stopPropagation(); resetUploadState(); }}
                >
                  {uploadState.status === "success" ? "Upload Different File" : "Try Again"}
                </Button>
              </div>
            )}
          </div>

          {isDragActive && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-primary">Drop your file here</p>
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
