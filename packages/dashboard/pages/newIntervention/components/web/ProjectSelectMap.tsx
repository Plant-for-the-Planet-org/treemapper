import { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin, Square } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

interface Props {
  updateGeoJSON: (geoJSON: any) => void;
  uploadedGeoJSON: any; // GeoJSON from file upload
  interventionType: string
}

const UnifiedMapComponent = ({ updateGeoJSON, uploadedGeoJSON, interventionType }: Props) => {
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

  // State to track if we're displaying uploaded GeoJSON
  const [displayingUploadedGeoJSON, setDisplayingUploadedGeoJSON] = useState(false);



  useEffect(() => {
    if(interventionType==='single-tree-registration'){
      setSelectionMode("point")
    }else{
        setSelectionMode("polygon")
    }
  }, [interventionType])
  

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
      updateGeoJSON(pointGeoJSON);
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
  }, [selectionMode, drawingPolygon, displayingUploadedGeoJSON]);

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
          <MapPin color="#007A49" size={24} />
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
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
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [event.lngLat.lng, event.lngLat.lat]
                }
              };

              setGeoJSON(pointGeoJSON);
            }}
          >
            <MapPin color="#007A49" size={24} />
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
                  'fill-color': '#007A49',
                  'fill-opacity': 0.3
                }}
              />
              <Layer
                id="drawing-polygon-outline"
                type="line"
                paint={{
                  'line-color': '#007A49',
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
                  backgroundColor: index === 0 ? '#007A49' : '#007A49',
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
                className={`w-full sm:w-auto ${manualCoords.latitude && manualCoords.longitude?'bg-green-800':'bg-gray-500'} text-white border-none py-1 px-3 rounded text-sm cursor-pointer hover:bg-blue-600 transition-colors`}
              >
                Set Location
              </button>
            </div>
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
    </div>
  );
};

export default UnifiedMapComponent;