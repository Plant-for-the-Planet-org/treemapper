import { useState, useCallback, useEffect } from 'react';
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

interface Props {
  updateGeoJSON: (geoJSON: any) => void;
  uploadedGeoJSON: any; // GeoJSON from file upload
  interventionType: string
  selectedSite?: any
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

const UnifiedMapComponent = ({ updateGeoJSON, uploadedGeoJSON, interventionType, selectedSite }: Props) => {
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



  useEffect(() => {
    if (interventionType === 'single-tree-registration') {
      setSelectionMode("point")
    } else {
      setSelectionMode("polygon")
    }
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


  // Helper function to calculate distance between two points
  const calculateDistance = (point1, point2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Polygon data as GeoJSON for drawing mode
  const drawingPolygonGeoJSON = {
    type: 'Polygon',
    coordinates: [
      polygonPoints.length >= 3
        ? [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
        : polygonPoints.map(p => [p.longitude, p.latitude])
    ]
  }
  
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
        // Check if clicking near the first point (within ~150 meters) to auto-complete
        if (polygonPoints.length >= 3) {
          const firstPoint = polygonPoints[0];
          const distance = calculateDistance(
            { latitude: firstPoint.latitude, longitude: firstPoint.longitude },
            { latitude: lngLat.lat, longitude: lngLat.lng }
          );
          
          // If clicking near first point (within 150 meters), auto-complete
          // This covers clicking on or near the marker hint as well
          if (distance < 150) {
            completePolygon();
            return;
          }
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
  }, [selectionMode, drawingPolygon, displayingUploadedGeoJSON, polygonPoints, polygonCompleted, updateGeoJSON, completePolygon]);
  
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

  // Handle selection mode toggle
  const toggleSelectionMode = () => {
    // Clear uploaded GeoJSON display when switching modes
    if (displayingUploadedGeoJSON) {
      setDisplayingUploadedGeoJSON(false);
    }

    // Reset current selection when changing modes
    if (selectionMode === 'point') {
      setSelectionMode('polygon');
      setMarker(null);
    } else {
      setSelectionMode('point');
      resetPolygon();
    }
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

        {/* Render uploaded GeoJSON */}
        {renderUploadedGeoJSON()}

        {/* Display marker if in point mode and marker exists (and not displaying uploaded) */}
        {selectionMode === 'point' && marker && !displayingUploadedGeoJSON && (
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

        {/* Done button (only in fullscreen) — disabled until location selected */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            disabled={!geoJSON}
            title={!geoJSON ? 'Select a location first' : 'Return to form'}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
              !geoJSON
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            Done
          </button>
        )}
      </div>

      {/* Mode selection toggle and controls */}
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
          {/* <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Selection Mode:</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                name="toggle"
                id="toggle"
                checked={selectionMode === 'polygon'}
                onChange={toggleSelectionMode}
                className="hidden"
              />
              <label
                htmlFor="toggle"
                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer 
                  ${selectionMode === 'polygon' ? 'bg-blue-500' : ''}`}
                style={{ width: '3rem' }}
              >
                <span
                  className={`bg-white block h-5 w-5 rounded-full transform transition-transform duration-200 ease-in 
                    ${selectionMode === 'polygon' ? 'translate-x-6' : 'translate-x-0'}`}
                  style={{ margin: '0.125rem' }}
                ></span>
              </label>
            </div>
            <div className="ml-2 text-sm">
              {selectionMode === 'point' ? (
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" /> Point
                </div>
              ) : (
                <div className="flex items-center">
                  <Square size={16} className="mr-1" /> Polygon
                </div>
              )}
            </div>
          </div> */}

          {/* Show polygon controls only in polygon mode */}
          {selectionMode === 'polygon' && !displayingUploadedGeoJSON && (
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
            {selectionMode === 'point' ? 'Location selected!' : 'Polygon completed!'}
          </div>
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