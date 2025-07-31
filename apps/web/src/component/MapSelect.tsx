import { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin, Square, ChevronDown, ChevronUp, Target, Check, RotateCcw, Settings } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

interface Props {
  updateGeoJSON: (geoJSON: any) => void;
  uploadedGeoJSON: any;
  mode: 'point' | 'polygon';
}

// Floating Control Panel Component
const ControlPanel = ({ children, title, isCollapsed, onToggle, className = "" }) => {
  return (
    <div className={`absolute bg-white rounded-lg shadow-lg border border-gray-200 z-10 transition-all duration-200 ${className}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {/* <Settings className="h-4 w-4 text-gray-600" /> */}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        )}
      </div>
      {!isCollapsed && (
        <div className="p-3 pt-0 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

// Coordinate Input Component
const CoordinateInput = ({ manualCoords, onCoordChange, onSetCoordinates }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="text"
            name="latitude"
            value={manualCoords.latitude}
            onChange={onCoordChange}
            placeholder="0"
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            style={{ color: '#262626' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="text"
            name="longitude"
            value={manualCoords.longitude}
            onChange={onCoordChange}
            placeholder="0"
            style={{ color: '#262626' }}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>
      <button
        onClick={onSetCoordinates}
        type="button"
        className={`w-full border-none py-2 px-3 text-white rounded-md text-xs font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md ${manualCoords.latitude == '' || manualCoords.longitude === ''
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-[#007A49] hover:bg-green-600 shadow-sm hover:shadow-md'
          }`}

      >
        Set Location
      </button>
    </div>
  );
};

// Polygon Controls Component
const PolygonControls = ({ polygonPoints, onComplete, onReset, isDrawing }) => {
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600">
        <p className="text-xs text-gray-500 leading-relaxed">
          Click on the map to add points. Need at least 3 points to complete.
        </p>
      </div>

      {polygonPoints.length > 0 && (
        <div className="bg-gray-50 rounded-md p-2">
          <div className="text-xs text-gray-600 mb-2">
            Points added: <span className="font-medium text-green-600">{polygonPoints.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onComplete}
              disabled={polygonPoints.length < 3}
              className={`flex-1 border-none py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 ${polygonPoints.length >= 3
                  ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <Check className="h-3 w-3" />
              Complete
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={polygonPoints.length === 0}
              className={`flex-1 border border-gray-300 py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 ${polygonPoints.length > 0
                  ? 'text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const UnifiedMapComponent = ({ updateGeoJSON, uploadedGeoJSON, mode }: Props) => {
  // Initial viewport settings
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3.5
  });

  // State for selected marker
  const [marker, setMarker] = useState(null);

  // State for polygon drawing
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);

  // GeoJSON state for storing the final data
  const [geoJSON, setGeoJSON] = useState(null);

  // State for manual coordinates input
  const [manualCoords, setManualCoords] = useState({
    latitude: '',
    longitude: ''
  });

  // State to track if we're displaying uploaded GeoJSON
  const [displayingUploadedGeoJSON, setDisplayingUploadedGeoJSON] = useState(false);

  // Control panel collapse states
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Effect to handle uploaded GeoJSON
  useEffect(() => {
    if (uploadedGeoJSON && uploadedGeoJSON !== geoJSON) {
      setGeoJSON(uploadedGeoJSON);
      setDisplayingUploadedGeoJSON(true);

      // Clear any existing manual selections
      setMarker(null);
      setPolygonPoints([]);
      setDrawingPolygon(false);

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

  // Effect to reset states when mode changes
  useEffect(() => {
    setMarker(null);
    setPolygonPoints([]);
    setDrawingPolygon(false);
    setGeoJSON(null);
    updateGeoJSON(null);
    if (displayingUploadedGeoJSON) {
      setDisplayingUploadedGeoJSON(false);
    }
  }, [mode]);

  // Effect to auto-expand panels when user interacts
  useEffect(() => {
    if (marker || polygonPoints.length > 0) {
      setIsControlsCollapsed(false);
    }
  }, [marker, polygonPoints.length]);

  // Polygon data as GeoJSON for drawing mode
  const drawingPolygonGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        polygonPoints.length >= 3
          ? [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
          : polygonPoints.map(p => [p.longitude, p.latitude])
      ]
    }
  };

  // Handle map click based on current mode
  const handleMapClick = useCallback(event => {
    const { lngLat } = event;

    // Clear uploaded GeoJSON display when user starts manual selection
    if (displayingUploadedGeoJSON) {
      setDisplayingUploadedGeoJSON(false);
    }

    if (mode === 'point') {
      // Point mode: set a single marker
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
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat]
        }
      };

      setGeoJSON(pointGeoJSON);
      updateGeoJSON(pointGeoJSON);
    } else if (mode === 'polygon') {
      // Polygon mode: add point to polygon
      if (!drawingPolygon) {
        // Start drawing polygon
        setDrawingPolygon(true);
        setPolygonPoints([{ longitude: lngLat.lng, latitude: lngLat.lat }]);
      } else {
        // Continue adding points to polygon
        setPolygonPoints(prev => [...prev, { longitude: lngLat.lng, latitude: lngLat.lat }]);
      }
    }
  }, [mode, drawingPolygon, displayingUploadedGeoJSON]);

  // Complete polygon drawing
  const completePolygon = () => {
    if (polygonPoints.length >= 3) {
      setDrawingPolygon(false);
      const completedPolygonGeoJSON = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
          ]
        }
      };
      setGeoJSON(completedPolygonGeoJSON);
      updateGeoJSON(completedPolygonGeoJSON);
    } else {
      alert('A polygon needs at least 3 points');
    }
  };

  // Reset polygon drawing
  const resetPolygon = () => {
    setDrawingPolygon(false);
    setPolygonPoints([]);
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
        latitude: lat,
        zoom: Math.max(viewState.zoom, 10)
      });

      // Create and store Point GeoJSON
      const pointGeoJSON = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      };

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
          <div className="relative">
            <MapPin color="#059669" size={28} className="drop-shadow-md" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          </div>
        </Marker>
      );
    } else if (firstFeature.geometry.type === 'Polygon') {
      return (
        <Source id="uploaded-polygon" type="geojson" data={firstFeature}>
          <Layer
            id="uploaded-polygon-fill"
            type="fill"
            paint={{
              'fill-color': '#059669',
              'fill-opacity': 0.2
            }}
          />
          <Layer
            id="uploaded-polygon-outline"
            type="line"
            paint={{
              'line-color': '#059669',
              'line-width': 3,
              'line-dasharray': [2, 4]
            }}
          />
        </Source>
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
        cursor={mode === 'polygon' && drawingPolygon ? 'crosshair' : 'default'}
      >
        {/* Default navigation controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />

        {/* Render uploaded GeoJSON */}
        {renderUploadedGeoJSON()}

        {/* Display marker if in point mode and marker exists (and not displaying uploaded) */}
        {mode === 'point' && marker && !displayingUploadedGeoJSON && (
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
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [event.lngLat.lng, event.lngLat.lat]
                }
              };

              setGeoJSON(pointGeoJSON);
              updateGeoJSON(pointGeoJSON);
            }}
          >
            <div className="relative group">
              <MapPin
                color="#059669"
                size={28}
                className="drop-shadow-md transition-transform group-hover:scale-110 cursor-grab active:cursor-grabbing"
              />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Drag to move
              </div>
            </div>
          </Marker>
        )}

        {/* Display polygon if in polygon mode and there are points (and not displaying uploaded) */}
        {mode === 'polygon' && polygonPoints.length > 0 && !displayingUploadedGeoJSON && (
          <>
            {/* Render the polygon */}
            <Source id="drawing-polygon" type="geojson" data={drawingPolygonGeoJSON}>
              <Layer
                id="drawing-polygon-fill"
                type="fill"
                paint={{
                  'fill-color': drawingPolygon ? '#059669' : '#16a34a',
                  'fill-opacity': drawingPolygon ? 0.1 : 0.2
                }}
              />
              <Layer
                id="drawing-polygon-outline"
                type="line"
                paint={{
                  'line-color': drawingPolygon ? '#059669' : '#16a34a',
                  'line-width': drawingPolygon ? 2 : 3,
                  'line-dasharray': drawingPolygon ? [3, 3] : [1, 0]
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
                <div className="relative group">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md transition-all duration-200 ${index === 0
                      ? 'bg-red-500 w-4 h-4'
                      : drawingPolygon
                        ? 'bg-green-500 group-hover:scale-125'
                        : 'bg-green-600'
                    }`} />
                  {index === 0 && polygonPoints.length > 1 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Start
                    </div>
                  )}
                </div>
              </Marker>
            ))}
          </>
        )}
      </Map>

      {/* Main Controls Panel */}
      <ControlPanel
        title={mode === 'point' ? 'Point Selection' : 'Polygon Drawing'}
        isCollapsed={isControlsCollapsed}
        onToggle={() => setIsControlsCollapsed(!isControlsCollapsed)}
        className="top-4 left-4"
      >
        {mode === 'polygon' ? (
          <PolygonControls
            polygonPoints={polygonPoints}
            onComplete={completePolygon}
            onReset={resetPolygon}
            isDrawing={drawingPolygon}
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              <p className="text-xs text-gray-500 leading-relaxed">
                Click on the map to place a marker or use coordinates below.
              </p>
            </div>

            {/* Manual Coordinates Input */}
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Manual Coordinates</div>
              <CoordinateInput
                manualCoords={manualCoords}
                onCoordChange={handleCoordChange}
                onSetCoordinates={handleSetCoordinates}
              />
            </div>
          </div>
        )}
      </ControlPanel>

      {/* Status Indicator */}
      {displayingUploadedGeoJSON && (
        <div className="absolute top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Uploaded location displayed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedMapComponent;