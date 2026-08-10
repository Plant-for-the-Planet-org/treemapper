"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import * as tj from "@tmcw/togeojson";
import * as turf from "@turf/turf";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Dedicated GeoJSON/KML upload for the new-intervention page.
// Kept separate from the shared component so its geometry rules are explicit
// and local to this flow: multi-tree accepts polygons only, single-tree
// accepts points only, and the allowed types are always driven by the prop
// (no silent "Point only" default).

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type GeometryType =
  | "Point"
  | "MultiPoint"
  | "Polygon"
  | "MultiPolygon"
  | "LineString"
  | "MultiLineString";

interface InterventionFileUploadProps {
  onGeoJSONChange: (geoJson: any | null) => void;
  // Geometry types this intervention accepts from an uploaded file.
  // Required on purpose so the caller is always explicit.
  allowedGeometryTypes: GeometryType[];
  className?: string;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  fileName?: string;
  geometryType?: string;
}

export default function InterventionFileUpload({
  onGeoJSONChange,
  allowedGeometryTypes,
  className = "",
}: InterventionFileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });

  const allowedLabel = allowedGeometryTypes.join(" or ");

  const resetUploadState = () => {
    setUploadState({ status: "idle", message: "" });
    onGeoJSONChange(null);
  };

  // Collect every geometry type present in the GeoJSON.
  const collectGeometryTypes = (geoJson: any): string[] => {
    const types = new Set<string>();

    const add = (t?: string) => {
      if (t) types.add(t);
    };

    if (geoJson?.type === "FeatureCollection" && Array.isArray(geoJson.features)) {
      for (const feature of geoJson.features) {
        add(feature?.geometry?.type);
      }
    } else if (geoJson?.type === "Feature") {
      add(geoJson.geometry?.type);
    } else {
      add(geoJson?.type);
    }

    return [...types];
  };

  const validateGeometry = (
    geoJson: any
  ): { valid: boolean; type: string | null; error?: string } => {
    const types = collectGeometryTypes(geoJson);

    if (types.length === 0) {
      return { valid: false, type: null, error: "No valid geometry found in the file." };
    }

    if (types.length > 1) {
      return {
        valid: false,
        type: null,
        error: `Mixed geometry types found (${types.join(", ")}). Only ${allowedLabel} is allowed.`,
      };
    }

    const type = types[0];
    if (!allowedGeometryTypes.includes(type as GeometryType)) {
      return {
        valid: false,
        type,
        error: `${type} geometry is not supported. Only ${allowedLabel} is allowed.`,
      };
    }

    return { valid: true, type };
  };

  // Strip altitude (Z): KML coordinates carry altitude, which PostGIS rejects
  // when the column expects 2D geometry. [lng, lat, alt?] -> [lng, lat].
  const strip2D = (coords: any): any => {
    if (!Array.isArray(coords)) return coords;
    if (typeof coords[0] === "number") return coords.slice(0, 2);
    return coords.map(strip2D);
  };

  const stripGeometry = (geometry: any): any =>
    geometry?.coordinates
      ? { ...geometry, coordinates: strip2D(geometry.coordinates) }
      : geometry;

  const stripAltitude = (geoJson: any): any => {
    if (geoJson?.type === "FeatureCollection") {
      return {
        ...geoJson,
        features: (geoJson.features ?? []).map((f: any) => ({
          ...f,
          geometry: stripGeometry(f.geometry),
        })),
      };
    }
    if (geoJson?.type === "Feature") {
      return { ...geoJson, geometry: stripGeometry(geoJson.geometry) };
    }
    return stripGeometry(geoJson);
  };

  // A Polygon/MultiPolygon feature with zero area (e.g. the same point repeated
  // for every vertex) has nothing to draw on the map, even though it's
  // structurally valid GeoJSON.
  const isDegenerateFeature = (feature: any): boolean => {
    const geometryType = feature?.geometry?.type;
    if (geometryType !== "Polygon" && geometryType !== "MultiPolygon") return false;
    try {
      return turf.area(feature) === 0;
    } catch {
      return true;
    }
  };

  // Normalize to a FeatureCollection with a single feature. When a file has
  // multiple features, prefer the first one that actually has area over
  // blindly taking features[0], which may be degenerate.
  const normalize = (geoJson: any): any | null => {
    if (geoJson?.type === "FeatureCollection") {
      if (!geoJson.features?.length) return null;
      const feature =
        geoJson.features.find((f: any) => !isDegenerateFeature(f)) ?? geoJson.features[0];
      return { type: "FeatureCollection", features: [feature] };
    }
    if (geoJson?.type === "Feature") {
      return { type: "FeatureCollection", features: [geoJson] };
    }
    if (
      ["Point", "Polygon", "MultiPolygon", "LineString", "MultiLineString", "MultiPoint"].includes(
        geoJson?.type
      )
    ) {
      return {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: geoJson }],
      };
    }
    return null;
  };

  const processGeoJSON = (geoJson: any, fileName: string) => {
    const validation = validateGeometry(geoJson);
    if (!validation.valid) {
      setUploadState({
        status: "error",
        message: validation.error || "Invalid geometry type.",
        fileName,
      });
      onGeoJSONChange(null);
      return;
    }

    const normalized = normalize(geoJson);
    if (!normalized) {
      setUploadState({
        status: "error",
        message: "Could not process the file structure.",
        fileName,
      });
      onGeoJSONChange(null);
      return;
    }

    setUploadState({
      status: "success",
      message: "File processed successfully.",
      fileName,
      geometryType: validation.type || undefined,
    });
    onGeoJSONChange(normalized);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();

      setUploadState({ status: "uploading", message: "Processing file...", fileName: file.name });

      const reader = new FileReader();

      reader.onabort = () =>
        setUploadState({ status: "error", message: "File reading was aborted.", fileName: file.name });
      reader.onerror = () =>
        setUploadState({ status: "error", message: "File reading failed.", fileName: file.name });

      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const content = event.target?.result as string;

          if (ext === "kml") {
            const dom = new DOMParser().parseFromString(content, "text/xml");
            if (dom.querySelector("parsererror")) {
              setUploadState({ status: "error", message: "Invalid KML file format.", fileName: file.name });
              return;
            }
            const geoJson = stripAltitude(tj.kml(dom));
            processGeoJSON(geoJson, file.name);
          } else if (ext === "geojson" || ext === "json") {
            const geoJson = stripAltitude(JSON.parse(content));
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
            message: ext === "kml" ? "Invalid KML file format." : "Invalid JSON format.",
            fileName: file.name,
          });
        }
      };

      reader.readAsText(file);
    },
    // allowedGeometryTypes feeds validation inside the closure; re-bind on change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowedGeometryTypes.join(",")]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
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
      if (rejection.errors.some((e) => e.code === "file-too-large")) {
        setUploadState({ status: "error", message: "File size must be less than 10MB.", fileName: rejection.file.name });
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
                    Supports: KML, GeoJSON ({allowedLabel} geometry)
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
                  onClick={(e) => {
                    e.stopPropagation();
                    resetUploadState();
                  }}
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
