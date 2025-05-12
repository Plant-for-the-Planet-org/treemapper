import { useState, useCallback, useEffect } from 'react';
// Import all components from the maplibre-specific path
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin, Square } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';



interface Props {
  updateGeoJSON: (geoJSON: any) => void;
}

const MapComponent = ({ updateGeoJSON }: Props) => {
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

  // GeoJSON state for storing the final data
  const [geoJSON, setGeoJSON] = useState(null);

  // State for manual coordinates input
  const [manualCoords, setManualCoords] = useState({
    latitude: '',
    longitude: ''
  });

  // Polygon data as GeoJSON
  const polygonGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        // Add closing point automatically if there are at least 3 points
        polygonPoints.length >= 3
          ? [...polygonPoints.map(p => [p.longitude, p.latitude]), [polygonPoints[0].longitude, polygonPoints[0].latitude]]
          : polygonPoints.map(p => [p.longitude, p.latitude])
      ]
    }
  };



  // Handle map click based on current mode
  const handleMapClick = useCallback(event => {
    const { lngLat } = event;

    if (selectionMode === 'point') {
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
      updateGeoJSON(pointGeoJSON)
    } else if (selectionMode === 'polygon') {
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
  }, [selectionMode, drawingPolygon]);

  // Complete polygon drawing
  const completePolygon = () => {
    if (polygonPoints.length >= 3) {
      setDrawingPolygon(false);
      setGeoJSON(polygonGeoJSON);
      updateGeoJSON(polygonGeoJSON)

    } else {
      alert('A polygon needs at least 3 points');
    }
  };

  // Reset polygon drawing
  const resetPolygon = () => {
    setDrawingPolygon(false);
    setPolygonPoints([]);
    setGeoJSON(null);
    updateGeoJSON(null)

  };

  // Handle selection mode toggle
  const toggleSelectionMode = () => {
    // Reset current selection when changing modes
    if (selectionMode === 'point') {
      setSelectionMode('polygon');
      setMarker(null);
    } else {
      setSelectionMode('point');
      resetPolygon();
    }
    setGeoJSON(null);
    updateGeoJSON(null)

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
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      };

      setGeoJSON(pointGeoJSON);
      updateGeoJSON(pointGeoJSON)

    }
  };



  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Default navigation controls (zoom, compass, etc.) */}
        <NavigationControl position="bottom-right" />

        {/* GeolocateControl - adds the find my location button */}
        <GeolocateControl
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />

        {/* Display marker if in point mode and marker exists */}
        {selectionMode === 'point' && marker && (
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
              updateGeoJSON(pointGeoJSON)

            }}
          >
            <MapPin color="#FF0000" size={24} />
          </Marker>
        )}

        {/* Display polygon if in polygon mode and there are points */}
        {selectionMode === 'polygon' && polygonPoints.length > 0 && (
          <>
            {/* Render the polygon */}
            <Source id="polygon" type="geojson" data={polygonGeoJSON}>
              <Layer
                id="polygon-fill"
                type="fill"
                paint={{
                  'fill-color': '#0080ff',
                  'fill-opacity': 0.3
                }}
              />
              <Layer
                id="polygon-outline"
                type="line"
                paint={{
                  'line-color': '#0080ff',
                  'line-width': 2
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
                  width: '12px',
                  height: '12px',
                  backgroundColor: index === 0 ? '#00FF00' : '#0080ff',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} />
              </Marker>
            ))}
          </>
        )}
      </Map>

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
          <div className="flex items-center justify-between">
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
          </div>

          {/* Show polygon controls only in polygon mode */}
          {selectionMode === 'polygon' && (
            <div className="flex gap-2">
              <button
                onClick={completePolygon}
                disabled={polygonPoints.length < 3}
                className={`bg-green-800 text-white border-none py-1 px-3 rounded text-sm cursor-pointer transition-colors
                  ${polygonPoints.length < 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
              >
                Complete Polygon
              </button>
              <button
                onClick={resetPolygon}
                disabled={polygonPoints.length === 0}
                className={`bg-red-700 text-white border-none py-1 px-3 rounded text-sm cursor-pointer transition-colors
                  ${polygonPoints.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate input form - only show in point mode */}
      {selectionMode === 'point' && (
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
                className="w-full sm:w-auto bg-blue-500 text-white border-none py-1 px-3 rounded text-sm cursor-pointer hover:bg-blue-600 transition-colors"
              >
                Set Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GeoJSON Output Display (useful for debugging) */}
      {geoJSON && (
        <div style={{
          position: 'absolute',
          bottom: selectionMode === 'point' ? '100px' : '20px',
          left: '20px',
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1,
          maxWidth: '300px',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          <div className="text-xs font-mono">
            <div className="font-bold mb-1">GeoJSON:</div>
            <pre>{JSON.stringify(geoJSON, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;