import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin, Square, Maximize2, Minimize2, Map as MapIcon, Satellite } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

const MAP_STYLES = {
  streets: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: {
    version: 8 as const,
    sources: {
      'esri-satellite': {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri',
      },
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster' as const,
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
};

interface MarkedPoint {
  longitude: number;
  latitude: number;
}

interface Props {
  updateGeoJSON: (geoJSON: any) => void;
  uploadedGeoJSON: any; // GeoJSON from file upload
  interventionType: string
  selectedSite?: any
  existingInterventions?: Array<{
    uid: string;
    hid?: string;
    type?: string;
    location: any;
    locationGeometryType?: string;
  }>
  // Bulk single-tree mode: each click drops a new persistent marker instead of
  // replacing a single point. The parent owns the marked-points list.
  isMultiSingleTree?: boolean
  markedPoints?: MarkedPoint[]
  onAddPoint?: (point: MarkedPoint) => void
  onRemovePoint?: (index: number) => void
  tagPrefix?: string
  // Geometry modes this intervention type allows, from the type config.
  // When both 'point' and 'polygon' are present, a toggle is shown.
  geometryModes?: Array<'point' | 'polygon'>
}

const parseSiteGeometry = (site: any): any | null => {
  if (!site) return null;
  const raw = site.originalGeometry ?? site.location ?? site.geometry;
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (raw.type === 'Feature' && raw.geometry) return raw.geometry;
  return raw;
};

const UnifiedMapComponent = ({ updateGeoJSON, uploadedGeoJSON, interventionType, selectedSite, existingInterventions = [], isMultiSingleTree = false, markedPoints = [], onAddPoint, onRemovePoint, tagPrefix = '', geometryModes = ['polygon'] }: Props) => {
  const mapRef = useRef(null);

  // Initial viewport settings
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3.5
  });

  // State for selected marker
  const [marker, setMarker] = useState(null);

  // Selection mode: 'point' or 'polygon'
  const [selectionMode, setSelectionMode] = useState('point');

  // State for polygon drawing
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [polygonCompleted, setPolygonCompleted] = useState(false);

  // GeoJSON state for storing the final data
  const [geoJSON, setGeoJSON] = useState(null);
  
  // State for showing success feedback
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  
  // State for area validation error
  const [areaError, setAreaError] = useState<string | null>(null);
  
  // State for current polygon area (for real-time display)
  const [currentArea, setCurrentArea] = useState<number | null>(null);

  // State for manual coordinates input
  const [manualCoords, setManualCoords] = useState({
    latitude: '',
    longitude: ''
  });

  // State to track if we're displaying uploaded GeoJSON
  const [displayingUploadedGeoJSON, setDisplayingUploadedGeoJSON] = useState(false);

  // Basemap style: 'streets' or 'satellite'
  const [mapStyleMode, setMapStyleMode] = useState<'streets' | 'satellite'>('streets');

  // Fullscreen toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Maximum allowed area in hectares
  const MAX_AREA_HECTARES = 1000;



  // True when the type allows the user to pick between point and polygon.
  const allowsBoth = geometryModes.includes('point') && geometryModes.includes('polygon');

  useEffect(() => {
    // Default mode when the intervention type changes. If only one geometry is
    // allowed, lock to it. When both are allowed, default to polygon (the prior
    // behavior) and let the toggle switch to point.
    const onlyPoint = geometryModes.includes('point') && !geometryModes.includes('polygon');
    setSelectionMode(onlyPoint ? 'point' : 'polygon');
  }, [interventionType])

  // Escape key exits fullscreen + lock body scroll while fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const siteGeometry = parseSiteGeometry(selectedSite);

  const existingFeatureCollections = (() => {
    const points: any[] = [];
    const polygons: any[] = [];
    for (const item of existingInterventions) {
      if (!item?.location) continue;
      const geomType = item.location.type || item.locationGeometryType;
      const feature = {
        type: 'Feature',
        geometry: item.location,
        properties: { uid: item.uid, hid: item.hid ?? '', type: item.type ?? '' },
      };
      if (geomType === 'Point') points.push(feature);
      else if (geomType === 'Polygon' || geomType === 'MultiPolygon') polygons.push(feature);
    }
    return {
      points: { type: 'FeatureCollection' as const, features: points },
      polygons: { type: 'FeatureCollection' as const, features: polygons },
    };
  })();

  useEffect(() => {
    if (!siteGeometry) return;
    try {
      const centroid = turf.centroid(siteGeometry as any);
      const [longitude, latitude] = centroid.geometry.coordinates;
      setViewState(prev => ({ ...prev, longitude, latitude, zoom: Math.max(prev.zoom, 13) }));
    } catch (err) {
      console.error('Site centroid error:', err);
    }
  }, [selectedSite?.uid])


  // Effect to handle uploaded GeoJSON
  useEffect(() => {
    if (uploadedGeoJSON && uploadedGeoJSON !== geoJSON) {
      setGeoJSON(uploadedGeoJSON);
      setDisplayingUploadedGeoJSON(true);

      // Clear any existing manual selections
      setMarker(null);
      setPolygonPoints([]);
      setDrawingPolygon(false);
      setPolygonCompleted(false);
      setShowSuccessFeedback(false);
      setAreaError(null);
      setCurrentArea(null);

      // Center map on uploaded GeoJSON
      try {
        const centroid = turf.centroid(uploadedGeoJSON);
        const [longitude, latitude] = centroid.geometry.coordinates;
        setViewState(prev => ({
          ...prev,
          longitude,
          latitude,
          zoom: 12
        }));
      } catch (error) {
        console.error('Error getting centroid:', error);
      }
    }
  }, [uploadedGeoJSON]);


  // Polygon data as GeoJSON for drawing mode
  const drawingPolygonGeoJSON = {
    type: 'Polygon',
    coordinates: [
      polygonPoints.length >= 3
        ? [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
        : polygonPoints.map(p => [p.longitude, p.latitude])
    ]
  }

  // Whether a click lands on the first vertex (in screen pixels, so it works at
  // any zoom). Uses the map ref like the site-creation map; guarded so a project
  // failure never aborts the click handler and blocks adding points.
  const isNearFirstPoint = useCallback((lngLat: any, firstPoint: any) => {
    if (!firstPoint || !mapRef.current) return false;
    try {
      const map = (mapRef.current as any).getMap();
      const firstPixel = map.project([firstPoint.longitude, firstPoint.latitude]);
      const clickPixel = map.project([lngLat.lng, lngLat.lat]);
      const PIXEL_THRESHOLD = 20;
      const distance = Math.sqrt(
        Math.pow(clickPixel.x - firstPixel.x, 2) +
        Math.pow(clickPixel.y - firstPixel.y, 2)
      );
      return distance < PIXEL_THRESHOLD;
    } catch {
      return false;
    }
  }, []);

  // Complete polygon drawing
  const completePolygon = useCallback(() => {
    if (polygonPoints.length < 3) {
      alert('A polygon needs at least 3 points');
      return;
    }
    
    // Create polygon GeoJSON for area calculation
    const completedPolygonGeoJSON = {
      type: 'Polygon',
      coordinates: [
        [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
      ]
    };
    
    // Calculate area in square meters, then convert to hectares
    try {
      const areaInSquareMeters = turf.area(completedPolygonGeoJSON);
      const areaInHectares = areaInSquareMeters / 10000;
      
      // Validate area
      if (areaInHectares > MAX_AREA_HECTARES) {
        setAreaError(`Plant location cannot be larger than ${MAX_AREA_HECTARES.toLocaleString()} hectares. Current area: ${areaInHectares.toFixed(2)} hectares. Please select a smaller area.`);
        setShowSuccessFeedback(false);
        return;
      }
      
      // Clear any previous area errors
      setAreaError(null);
      
      // Complete the polygon
      setDrawingPolygon(false);
      setPolygonCompleted(true);
      setGeoJSON(completedPolygonGeoJSON);
      updateGeoJSON(completedPolygonGeoJSON);
      setCurrentArea(null); // Clear real-time area display after completion
      
      // Show success feedback
      setShowSuccessFeedback(true);
      setTimeout(() => setShowSuccessFeedback(false), 2000);
    } catch (error) {
      console.error('Error calculating polygon area:', error);
      setAreaError('Error calculating area. Please try again.');
      setShowSuccessFeedback(false);
    }
  }, [polygonPoints, updateGeoJSON]);
  
  // Handle map click based on current mode
  const handleMapClick = useCallback(event => {
    const { lngLat, originalEvent } = event;
    
    // Check if the click was on the completion hint or any interactive element
    if (originalEvent?.target) {
      const target = originalEvent.target as HTMLElement;
      // Check if clicking on the completion hint using data attribute or text content
      const isCompletionHint = target.dataset.completionHint === 'true' ||
                                target.closest('[data-completion-hint="true"]') !== null ||
                                target.textContent?.includes('Click here to complete') ||
                                target.closest('div')?.textContent?.includes('Click here to complete');
      
      if (isCompletionHint) {
        // Don't process map click - let the completion hint handle it
        return;
      }
    }

    // Clear uploaded GeoJSON display when user starts manual selection
    if (displayingUploadedGeoJSON) {
      setDisplayingUploadedGeoJSON(false);
    }

    if (selectionMode === 'point') {
      // Bulk single-tree mode: append a new marker, let the parent track the list.
      if (isMultiSingleTree) {
        onAddPoint?.({ longitude: lngLat.lng, latitude: lngLat.lat });
        setShowSuccessFeedback(true);
        setTimeout(() => setShowSuccessFeedback(false), 2000);
        return;
      }

      // Point mode: set a single marker and immediately select it
      const point = {
        longitude: lngLat.lng,
        latitude: lngLat.lat
      };

      setMarker(point);
      setManualCoords({
        longitude: lngLat.lng.toFixed(6),
        latitude: lngLat.lat.toFixed(6)
      });

      // Create and store Point GeoJSON
      const pointGeoJSON = {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat]
        }

      setGeoJSON(pointGeoJSON);
      updateGeoJSON(pointGeoJSON);

      // Show success feedback
      setShowSuccessFeedback(true);
      setTimeout(() => setShowSuccessFeedback(false), 2000);
    } else if (selectionMode === 'polygon') {
      // If polygon is already completed, don't add more points
      if (polygonCompleted) {
        return;
      }
      
      // Polygon mode: add point to polygon
      if (!drawingPolygon) {
        // Start drawing polygon
        setDrawingPolygon(true);
        setPolygonPoints([{ longitude: lngLat.lng, latitude: lngLat.lat }]);
        setPolygonCompleted(false);
        setCurrentArea(null);
        setAreaError(null);
      } else {
        // Auto-complete only when the click lands on the first vertex (measured
        // in screen pixels, so it behaves the same at every zoom level). Anywhere
        // else just adds another point, so the polygon can have unlimited points.
        if (polygonPoints.length >= 3 && isNearFirstPoint(lngLat, polygonPoints[0])) {
          completePolygon();
          return;
        }

        // Continue adding points to polygon
        setPolygonPoints(prev => {
          const newPoints = [...prev, { longitude: lngLat.lng, latitude: lngLat.lat }];
          
          // Calculate area in real-time if we have 3+ points
          if (newPoints.length >= 3) {
            try {
              const tempPolygon = {
                type: 'Polygon',
                coordinates: [
                  [...newPoints.map(p => [p.longitude, p.latitude]), [newPoints[0].longitude, newPoints[0].latitude]]
                ]
              };
              const areaInSquareMeters = turf.area(tempPolygon);
              const areaInHectares = areaInSquareMeters / 10000;
              setCurrentArea(areaInHectares);
              
              // Clear area error when user adds more points (they're adjusting)
              if (areaError) {
                setAreaError(null);
              }
            } catch (error) {
              console.error('Error calculating area:', error);
            }
          }
          
          return newPoints;
        });
      }
    }
  }, [selectionMode, drawingPolygon, displayingUploadedGeoJSON, polygonPoints, polygonCompleted, updateGeoJSON, completePolygon, isMultiSingleTree, onAddPoint, isNearFirstPoint]);
  
  // Handle double-click to complete polygon
  const handleMapDoubleClick = useCallback(event => {
    if (selectionMode === 'polygon' && drawingPolygon && polygonPoints.length >= 3 && !polygonCompleted) {
      event.preventDefault();
      completePolygon();
    }
  }, [selectionMode, drawingPolygon, polygonPoints.length, polygonCompleted, completePolygon]);

  // Reset polygon drawing
  const resetPolygon = () => {
    setDrawingPolygon(false);
    setPolygonPoints([]);
    setPolygonCompleted(false);
    setGeoJSON(null);
    updateGeoJSON(null);
    setShowSuccessFeedback(false);
    setAreaError(null);
    setCurrentArea(null);
  };

  // Switch between point and polygon selection (only when the type allows both).
  const handleSelectMode = (mode: 'point' | 'polygon') => {
    if (mode === selectionMode) return;

    // Clear uploaded GeoJSON display when switching modes
    if (displayingUploadedGeoJSON) {
      setDisplayingUploadedGeoJSON(false);
    }

    // Reset the selection that belongs to the mode we are leaving.
    if (mode === 'polygon') {
      setMarker(null);
    } else {
      resetPolygon();
    }
    setSelectionMode(mode);
    setGeoJSON(null);
    updateGeoJSON(null);
  };

  // Handle manual coordinate input
  const handleCoordChange = (e) => {
    const { name, value } = e.target;
    setManualCoords({
      ...manualCoords,
      [name]: value
    });
  };

  // Set marker from manual coordinates
  const handleSetCoordinates = () => {
    if (selectionMode !== 'point') {
      alert('Manual coordinates are only available in point selection mode');
      return;
    }

    const lng = parseFloat(manualCoords.longitude);
    const lat = parseFloat(manualCoords.latitude);

    if (!isNaN(lng) && !isNaN(lat)) {
      // Clear uploaded GeoJSON display when using manual coordinates
      if (displayingUploadedGeoJSON) {
        setDisplayingUploadedGeoJSON(false);
      }

      // Bulk single-tree mode: append the manual point to the list.
      if (isMultiSingleTree) {
        onAddPoint?.({ longitude: lng, latitude: lat });
        setViewState({ ...viewState, longitude: lng, latitude: lat });
        setShowSuccessFeedback(true);
        setTimeout(() => setShowSuccessFeedback(false), 2000);
        return;
      }

      const point = {
        longitude: lng,
        latitude: lat
      };

      setMarker(point);

      // Update viewport to center on the new marker
      setViewState({
        ...viewState,
        longitude: lng,
        latitude: lat
      });

      // Create and store Point GeoJSON
      const pointGeoJSON = {
        type: 'Point',
        coordinates: [lng, lat]
      }
      setGeoJSON(pointGeoJSON);
      updateGeoJSON(pointGeoJSON);
    }
  };

  // Function to render uploaded GeoJSON
  const renderUploadedGeoJSON = () => {
    if (!displayingUploadedGeoJSON || !geoJSON) return null;

    const firstFeature = geoJSON.features ? geoJSON.features[0] : geoJSON;

    if (firstFeature.geometry.type === 'Point') {
      const [longitude, latitude] = firstFeature.geometry.coordinates;
      return (
        <Marker
          longitude={longitude}
          latitude={latitude}
          anchor="bottom"
        >
          <MapPin color={markerColor} size={24} style={markerStyle} />
        </Marker>
      );
    } else if (firstFeature.geometry.type === 'Polygon') {
      return (
        <Source id="uploaded-polygon" type="geojson" data={firstFeature}>
          <Layer
            id="uploaded-polygon-fill"
            type="fill"
            paint={{
              'fill-color': '#007A49',
              'fill-opacity': 0.3
            }}
          />
          <Layer
            id="uploaded-polygon-outline"
            type="line"
            paint={{
              'line-color': '#007A49',
              'line-width': 2
            }}
          />
        </Source>
      );
    }
  };

  const markerColor = mapStyleMode === 'satellite' ? '#ffffff' : '#007A49';
  const markerStyle: React.CSSProperties = mapStyleMode === 'satellite'
    ? { filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.85))' }
    : {};

  // Control-panel visibility. The mode toggle only appears when the type allows
  // both geometries and we are not in bulk single-tree or file-display mode.
  const showModeToggle = allowsBoth && !isMultiSingleTree && !displayingUploadedGeoJSON;
  const showPolygonControls = selectionMode === 'polygon' && !displayingUploadedGeoJSON;

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#000',
      }
    : { position: 'relative', width: '100%', height: '100%' };

  const mapContent = (
    <div style={containerStyle}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLES[mapStyleMode] as any}
        onClick={handleMapClick}
        onDblClick={handleMapDoubleClick}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Default navigation controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />

        {/* Selected site boundary (non-interactive) */}
        {siteGeometry && (
          <Source id="site-boundary" type="geojson" data={siteGeometry as any}>
            <Layer
              id="site-boundary-fill"
              type="fill"
              paint={{ 'fill-color': markerColor, 'fill-opacity': mapStyleMode === 'satellite' ? 0.12 : 0.08 }}
            />
            <Layer
              id="site-boundary-line"
              type="line"
              paint={{ 'line-color': markerColor, 'line-width': 2, 'line-dasharray': [3, 2] }}
            />
          </Source>
        )}

        {/* Existing interventions overlay (non-interactive) */}
        {existingFeatureCollections.polygons.features.length > 0 && (
          <Source id="existing-interventions-polygons" type="geojson" data={existingFeatureCollections.polygons as any}>
            <Layer
              id="existing-interventions-polygon-fill"
              type="fill"
              paint={{ 'fill-color': '#f59e0b', 'fill-opacity': mapStyleMode === 'satellite' ? 0.28 : 0.2 }}
            />
            <Layer
              id="existing-interventions-polygon-outline"
              type="line"
              paint={{ 'line-color': '#b45309', 'line-width': 1.5 }}
            />
          </Source>
        )}
        {existingFeatureCollections.points.features.length > 0 && (
          <Source id="existing-interventions-points" type="geojson" data={existingFeatureCollections.points as any}>
            <Layer
              id="existing-interventions-point-halo"
              type="circle"
              paint={{
                'circle-radius': 8,
                'circle-color': '#f59e0b',
                'circle-opacity': 0.25,
              }}
            />
            <Layer
              id="existing-interventions-point"
              type="circle"
              paint={{
                'circle-radius': 4,
                'circle-color': '#b45309',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </Source>
        )}

        {/* Render uploaded GeoJSON */}
        {renderUploadedGeoJSON()}

        {/* Bulk single-tree mode: render every marked tree as a numbered pin.
            Clicking a pin removes that tree. */}
        {isMultiSingleTree && markedPoints.map((point, index) => (
          <Marker
            key={index}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
          >
            <button
              type="button"
              title={`${tagPrefix}${index + 1} (click to remove)`}
              onClick={(e) => {
                e.stopPropagation();
                onRemovePoint?.(index);
              }}
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <MapPin color={markerColor} size={28} style={markerStyle} />
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: mapStyleMode === 'satellite' ? '#0f766e' : '#ffffff',
                  pointerEvents: 'none',
                }}
              >
                {index + 1}
              </span>
            </button>
          </Marker>
        ))}

        {/* Display marker if in point mode and marker exists (and not displaying uploaded) */}
        {selectionMode === 'point' && marker && !displayingUploadedGeoJSON && !isMultiSingleTree && (
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            draggable
            onDragEnd={(event) => {
              const point = {
                longitude: event.lngLat.lng,
                latitude: event.lngLat.lat
              };

              setMarker(point);
              setManualCoords({
                longitude: event.lngLat.lng.toFixed(6),
                latitude: event.lngLat.lat.toFixed(6)
              });

              // Update GeoJSON for the dragged point
              const pointGeoJSON = {
                type: 'Point',
                coordinates: [event.lngLat.lng, event.lngLat.lat]
              }

              setGeoJSON(pointGeoJSON);
              updateGeoJSON(pointGeoJSON);
            }}
          >
            <MapPin color={markerColor} size={24} style={markerStyle} />
          </Marker>
        )}

        {/* Display polygon if in polygon mode and there are points (and not displaying uploaded) */}
        {selectionMode === 'polygon' && polygonPoints.length > 0 && !displayingUploadedGeoJSON && (
          <>
            {/* Render the polygon */}
            <Source id="drawing-polygon" type="geojson" data={drawingPolygonGeoJSON}>
              <Layer
                id="drawing-polygon-fill"
                type="fill"
                paint={{
                  'fill-color': polygonCompleted ? '#10b981' : '#007A49',
                  'fill-opacity': polygonCompleted ? 0.4 : 0.3
                }}
              />
              <Layer
                id="drawing-polygon-outline"
                type="line"
                paint={{
                  'line-color': polygonCompleted ? '#10b981' : '#007A49',
                  'line-width': polygonCompleted ? 3 : 2,
                  'line-dasharray': polygonCompleted ? [0, 0] : [2, 2]
                }}
              />
            </Source>

            {/* Render markers for each vertex */}
            {polygonPoints.map((point, index) => (
              <Marker
                key={index}
                longitude={point.longitude}
                latitude={point.latitude}
                anchor="center"
              >
                <div style={{
                  width: index === 0 && polygonPoints.length >= 3 ? '16px' : '12px',
                  height: index === 0 && polygonPoints.length >= 3 ? '16px' : '12px',
                  backgroundColor: index === 0 && polygonPoints.length >= 3 ? '#10b981' : '#007A49',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: index === 0 && polygonPoints.length >= 3 ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : 'none'
                }} />
              </Marker>
            ))}
            
            {/* Show hint for first point when ready to complete */}
            {polygonPoints.length >= 3 && !polygonCompleted && (
              <Marker
                longitude={polygonPoints[0].longitude}
                latitude={polygonPoints[0].latitude}
                anchor="bottom"
                offset={[0, -10]}
              >
                <div 
                  data-completion-hint="true"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    completePolygon();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    completePolygon();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      completePolygon();
                    }
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    zIndex: 1000
                  }}
                >
                  Click here to complete
                </div>
              </Marker>
            )}
          </>
        )}
      </Map>

      {/* Top-right control cluster: layer toggle + fullscreen */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Basemap layer toggle (pill switch) */}
        <div
          style={{
            background: 'white',
            borderRadius: '999px',
            padding: '4px',
            display: 'flex',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setMapStyleMode('streets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              mapStyleMode === 'streets'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-pressed={mapStyleMode === 'streets'}
          >
            <MapIcon size={14} /> Streets
          </button>
          <button
            type="button"
            onClick={() => setMapStyleMode('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              mapStyleMode === 'satellite'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-pressed={mapStyleMode === 'satellite'}
          >
            <Satellite size={14} /> Satellite
          </button>
        </div>

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(prev => !prev)}
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Open fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200/80 transition-colors"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFullscreen ? 'Normal view' : 'Fullscreen'}</span>
        </button>

        {/* Done button (only in fullscreen) — disabled until a selection exists.
            In bulk single-tree mode the selection is the marked-points list,
            not the single geoJSON. */}
        {isFullscreen && (() => {
          const hasSelection = isMultiSingleTree ? markedPoints.length > 0 : Boolean(geoJSON);
          return (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              disabled={!hasSelection}
              title={
                !hasSelection
                  ? (isMultiSingleTree ? 'Mark at least one tree first' : 'Select a location first')
                  : 'Return to form'
              }
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                !hasSelection
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              Done
            </button>
          );
        })()}
      </div>

      {/* Mode selection toggle and controls */}
      {(showModeToggle || showPolygonControls) && (
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        zIndex: 1
      }}>
        <div className="flex flex-col gap-3">
          {/* Point / Polygon mode toggle (only when both are allowed) */}
          {showModeToggle && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleSelectMode('point')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectionMode === 'point'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-pressed={selectionMode === 'point'}
              >
                <MapPin size={14} /> Point
              </button>
              <button
                type="button"
                onClick={() => handleSelectMode('polygon')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectionMode === 'polygon'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-pressed={selectionMode === 'polygon'}
              >
                <Square size={14} /> Polygon
              </button>
            </div>
          )}

          {/* Show polygon controls only in polygon mode */}
          {showPolygonControls && (
            <div className="flex flex-col gap-2">
              {!polygonCompleted ? (
                <>
                  <div className="text-xs text-gray-600 mb-1">
                    {polygonPoints.length === 0 
                      ? 'Click on the map to start drawing'
                      : polygonPoints.length < 3
                      ? `Add ${3 - polygonPoints.length} more point${3 - polygonPoints.length > 1 ? 's' : ''} to complete`
                      : 'Click the first point or double-click to complete'}
                  </div>
                  {currentArea !== null && polygonPoints.length >= 3 && (
                    <div className={`text-xs font-semibold mb-1 ${
                      currentArea > MAX_AREA_HECTARES ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      Current area: {currentArea.toFixed(2)} hectares 
                      {currentArea > MAX_AREA_HECTARES && ` (Max: ${MAX_AREA_HECTARES.toLocaleString()} ha)`}
                    </div>
                  )}
                  {areaError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                      <div className="text-xs text-red-800 font-semibold flex items-start gap-1">
                        <span>⚠️</span>
                        <span>{areaError}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={completePolygon}
                      disabled={polygonPoints.length < 3}
                      className={`bg-green-700 text-white border-none py-1 px-3 rounded text-sm cursor-pointer transition-colors
                        ${polygonPoints.length < 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-800'}`}
                    >
                      Complete Polygon
                    </button>
                    <button
                      type="button"
                      onClick={resetPolygon}
                      disabled={polygonPoints.length === 0}
                      className={`text-gray-500 border-none py-1 px-3 rounded text-sm cursor-pointer transition-colors
                        ${polygonPoints.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
                    >
                      Reset
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-green-700 font-semibold">
                    ✓ Polygon selected
                  </div>
                  <button
                    type="button"
                    onClick={resetPolygon}
                    className="text-gray-500 border-none py-1 px-3 rounded text-sm cursor-pointer transition-colors hover:bg-gray-300"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show status when displaying uploaded GeoJSON */}
          {/* {displayingUploadedGeoJSON && (
            <div className="text-sm text-green-600 font-medium">
              📁 Displaying uploaded file
            </div>
          )} */}
        </div>
      </div>
      )}

      {/* Coordinate input form - only show in point mode and not displaying uploaded */}
      {selectionMode === 'point' && !displayingUploadedGeoJSON && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1
        }}>
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="w-full sm:w-auto">
              <label className="block text-xs mb-1">
                Latitude:
              </label>
              <input
                type="text"
                name="latitude"
                value={manualCoords.latitude}
                onChange={handleCoordChange}
                className="w-full sm:w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-xs mb-1">
                Longitude:
              </label>
              <input
                type="text"
                name="longitude"
                value={manualCoords.longitude}
                onChange={handleCoordChange}
                className="w-full sm:w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="w-full sm:w-auto self-end mt-4 sm:mt-0">
              <button
                onClick={handleSetCoordinates}
                type="button"
                className={`w-full sm:w-auto ${manualCoords.latitude && manualCoords.longitude ? 'bg-green-800' : 'bg-gray-500'} text-white border-none py-1 px-3 rounded text-sm cursor-pointer hover:bg-blue-600 transition-colors`}
              >
                Set Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Feedback Toast */}
      {showSuccessFeedback && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ fontSize: '18px' }}>✓</div>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>
            {isMultiSingleTree
              ? 'Tree marked!'
              : selectionMode === 'point' ? 'Location selected!' : 'Polygon completed!'}
          </div>
        </div>
      )}

      {/* Bulk single-tree mode: marked-trees count badge */}
      {isMultiSingleTree && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          padding: '6px 14px',
          borderRadius: '999px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <MapPin size={14} className="text-teal-600" />
          <span className="text-xs font-semibold text-slate-900">
            {markedPoints.length} tree{markedPoints.length === 1 ? '' : 's'} marked
          </span>
        </div>
      )}

      {/* GeoJSON Output Display */}
      {geoJSON && (
        <div style={{
          position: 'absolute',
          bottom: (selectionMode === 'point' && !displayingUploadedGeoJSON) ? '100px' : '20px',
          left: '20px',
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1,
          maxWidth: '300px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <div className="text-xs font-mono">
            <div className="font-bold mb-1">
              {displayingUploadedGeoJSON ? 'Uploaded GeoJSON:' : 'Selected GeoJSON:'}
            </div>
            <pre>{JSON.stringify(geoJSON, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(mapContent, document.body);
  }

  return mapContent;
};

export default UnifiedMapComponent;