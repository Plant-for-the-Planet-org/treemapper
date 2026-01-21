import { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin, RotateCcw } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

interface Props {
  updateGeoJSON: (geoJSON: any) => void;
  uploadedGeoJSON: any;
  mode: 'point' | 'polygon';
}

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
        className={`w-full border-none  text-white px-5 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md ${manualCoords.latitude == '' || manualCoords.longitude === ''
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-[#007A49] hover:bg-[#006B3F] shadow-sm hover:shadow-md'
          }`}

      >
        Set Location
      </button>
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

  // State to show manual coordinate input
  const [showManualInput, setShowManualInput] = useState(false);

  // State for area error
  const [areaError, setAreaError] = useState<string | null>(null);

  // Max area in hectares
  const MAX_AREA_HECTARES = 25000;

  // Effect to handle uploaded GeoJSON
  useEffect(() => {
    if (uploadedGeoJSON && uploadedGeoJSON !== geoJSON) {
      // Clear any existing manual selections
      setMarker(null);
      setPolygonPoints([]);
      setDrawingPolygon(false);
      setAreaError(null);

      // Validate area for polygon uploads
      try {
        const feature = uploadedGeoJSON.features ? uploadedGeoJSON.features[0] : uploadedGeoJSON;
        if (feature.type === 'Polygon' || feature.geometry?.type === 'Polygon') {
          const areaInSquareMeters = turf.area(uploadedGeoJSON);
          const areaInHectares = areaInSquareMeters / 10000;

          if (areaInHectares > MAX_AREA_HECTARES) {
            setAreaError(`Uploaded polygon exceeds maximum limit of ${MAX_AREA_HECTARES.toLocaleString()} hectares. Area: ${areaInHectares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`);
            setDisplayingUploadedGeoJSON(false);
            setGeoJSON(null);
            return;
          }
        }
      } catch (error) {
        console.error('Error validating uploaded GeoJSON area:', error);
      }

      setGeoJSON(uploadedGeoJSON);
      setDisplayingUploadedGeoJSON(true);

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
    setAreaError(null);
    if (displayingUploadedGeoJSON) {
      setDisplayingUploadedGeoJSON(false);
    }
  }, [mode]);




  // Polygon data as GeoJSON for drawing mode
  const drawingPolygonGeoJSON = {
    type: 'Polygon',
    coordinates: [
      polygonPoints.length >= 3
        ? [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
        : polygonPoints.map(p => [p.longitude, p.latitude])
    ]
  };

  // Check if click is near the first point (to close polygon)
  const isNearFirstPoint = useCallback((lngLat, firstPoint, zoom) => {
    if (!firstPoint) return false;
    // Threshold decreases as zoom increases (more precise at higher zoom)
    const threshold = 20 / Math.pow(2, zoom - 10);
    const distance = Math.sqrt(
      Math.pow(lngLat.lng - firstPoint.longitude, 2) +
      Math.pow(lngLat.lat - firstPoint.latitude, 2)
    );
    return distance < threshold;
  }, []);

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
        type: 'Point',
        coordinates: [lngLat.lng, lngLat.lat]
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
        // Check if clicking near first point to close polygon (need at least 3 points)
        if (polygonPoints.length >= 3 && isNearFirstPoint(lngLat, polygonPoints[0], viewState.zoom)) {
          // Auto-complete the polygon
          const completedPolygonGeoJSON = {
            type: 'Polygon',
            coordinates: [
              [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
            ]
          };

          // Calculate area in hectares
          const areaInSquareMeters = turf.area(completedPolygonGeoJSON as GeoJSON.Polygon);
          const areaInHectares = areaInSquareMeters / 10000;

          // Validate area
          if (areaInHectares > MAX_AREA_HECTARES) {
            setAreaError(`Area exceeds maximum limit of ${MAX_AREA_HECTARES.toLocaleString()} hectares. Current area: ${areaInHectares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`);
            return;
          }

          setAreaError(null);
          setDrawingPolygon(false);
          setGeoJSON(completedPolygonGeoJSON);
          updateGeoJSON(completedPolygonGeoJSON);
        } else {
          // Continue adding points to polygon
          setPolygonPoints(prev => [...prev, { longitude: lngLat.lng, latitude: lngLat.lat }]);
        }
      }
    }
  }, [mode, drawingPolygon, displayingUploadedGeoJSON, polygonPoints, viewState.zoom, isNearFirstPoint, updateGeoJSON, MAX_AREA_HECTARES]);

  // Reset polygon drawing
  const resetPolygon = () => {
    setDrawingPolygon(false);
    setPolygonPoints([]);
    setGeoJSON(null);
    updateGeoJSON(null);
    setAreaError(null);
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
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      }

      setGeoJSON(pointGeoJSON);
      updateGeoJSON(pointGeoJSON);
    }
  };

  // Add polygon point from manual coordinates
  const handleAddPolygonPoint = () => {
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

      // If not drawing, start drawing
      if (!drawingPolygon) {
        setDrawingPolygon(true);
        setPolygonPoints([point]);
      } else {
        // Add point to existing polygon
        setPolygonPoints(prev => [...prev, point]);
      }

      // Update viewport to center on the new point
      setViewState({
        ...viewState,
        longitude: lng,
        latitude: lat,
        zoom: Math.max(viewState.zoom, 10)
      });

      // Clear the input fields after adding the point
      setManualCoords({
        latitude: '',
        longitude: ''
      });
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
                type: 'Point',
                coordinates: [event.lngLat.lng, event.lngLat.lat]
              }


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

      {/* Point Mode UI */}
      {mode === 'point' && (
        <>
          {/* Instruction or Selected Location Display */}
          {!marker && !displayingUploadedGeoJSON ? (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-3">
              <p className="text-sm text-gray-600">Click on the map to select a location</p>
              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                className="mt-2 text-xs text-[#007A49] hover:underline"
              >
                {showManualInput ? 'Hide' : 'Or enter coordinates manually'}
              </button>
              {showManualInput && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <CoordinateInput
                    manualCoords={manualCoords}
                    onCoordChange={handleCoordChange}
                    onSetCoordinates={handleSetCoordinates}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Location Selected</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMarker(null);
                    setGeoJSON(null);
                    updateGeoJSON(null);
                    setManualCoords({ latitude: '', longitude: '' });
                    setDisplayingUploadedGeoJSON(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Clear selection"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Lat: {marker?.latitude?.toFixed(6) || manualCoords.latitude}</p>
                <p>Lng: {marker?.longitude?.toFixed(6) || manualCoords.longitude}</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">Drag marker to adjust</p>
            </div>
          )}
        </>
      )}

      {/* Polygon Mode UI */}
      {mode === 'polygon' && (
        <>
          {/* Before drawing or while drawing */}
          {(polygonPoints.length === 0 || drawingPolygon) && !displayingUploadedGeoJSON ? (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-3 max-w-xs">
              {polygonPoints.length === 0 ? (
                <>
                  <p className="text-sm text-gray-600">Click on the map to start drawing a polygon</p>
                  <p className="text-xs text-gray-400 mt-1">Maximum area: {MAX_AREA_HECTARES.toLocaleString()} hectares</p>
                  {areaError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-600 font-medium">{areaError}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="mt-2 text-xs text-[#007A49] hover:underline"
                  >
                    {showManualInput ? 'Hide' : 'Or enter coordinates manually'}
                  </button>
                  {showManualInput && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                            <input
                              type="text"
                              name="latitude"
                              value={manualCoords.latitude}
                              onChange={handleCoordChange}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              style={{ color: '#262626' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                            <input
                              type="text"
                              name="longitude"
                              value={manualCoords.longitude}
                              onChange={handleCoordChange}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              style={{ color: '#262626' }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleAddPolygonPoint}
                          type="button"
                          disabled={manualCoords.latitude === '' || manualCoords.longitude === ''}
                          className={`w-full border-none text-white px-4 py-2 rounded text-sm font-medium transition-all ${
                            manualCoords.latitude === '' || manualCoords.longitude === ''
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-[#007A49] hover:bg-[#006B3F] cursor-pointer'
                          }`}
                        >
                          Add Point
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-900">Drawing Polygon</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetPolygon}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Reset"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Points added: <span className="font-medium text-green-600">{polygonPoints.length}</span></p>
                    {polygonPoints.length < 3 ? (
                      <p className="text-gray-500">Add {3 - polygonPoints.length} more point{3 - polygonPoints.length > 1 ? 's' : ''} to close</p>
                    ) : (
                      <p className="text-green-600 font-medium">Click on the first point (red) to close the polygon</p>
                    )}
                  </div>
                  {areaError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-600 font-medium">{areaError}</p>
                      <p className="text-xs text-red-500 mt-1">Please draw a smaller area or remove some points.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : polygonPoints.length > 0 && !drawingPolygon && !displayingUploadedGeoJSON ? (
            /* Polygon completed */
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Polygon Selected</span>
                </div>
                <button
                  type="button"
                  onClick={resetPolygon}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Clear selection"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-600">
                <p>{polygonPoints.length} vertices</p>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Status Indicator */}
      {
        displayingUploadedGeoJSON && (
          <div className="absolute top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Uploaded location displayed</span>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default UnifiedMapComponent;