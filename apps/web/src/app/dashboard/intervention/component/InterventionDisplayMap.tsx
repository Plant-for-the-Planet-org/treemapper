import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin, AlertTriangle, Info, Layers } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  geoJSON: any; // GeoJSON data or geometry from parent
}

const MapDisplayComponent = ({ geoJSON }: Props) => {
  const mapRef = useRef();
  const [error, setError] = useState(null);
  const [processedGeoJSON, setProcessedGeoJSON] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  
  console.log("Raw geoJSON prop:", geoJSON);

  // Initial viewport settings
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 5
  });

  // Function to validate and normalize GeoJSON data
  const validateAndNormalizeGeoJSON = (data) => {
    if (!data) {
      return { error: "No data provided", geoJSON: null };
    }

    try {
      let normalizedGeoJSON = null;

      // Check if it's already a full GeoJSON object
      if (data.type === 'Feature' && data.geometry) {
        normalizedGeoJSON = data;
      } 
      // Check if it's a FeatureCollection
      else if (data.type === 'FeatureCollection' && data.features && data.features.length > 0) {
        // Use the first feature for simplicity
        normalizedGeoJSON = data.features[0];
      }
      // Check if it's just a geometry object
      else if (data.type && data.coordinates) {
        normalizedGeoJSON = {
          type: 'Feature',
          geometry: data,
          properties: {}
        };
      }
      // Check if it has a geometry property (old format)
      else if (data.geometry && data.geometry.type && data.geometry.coordinates) {
        normalizedGeoJSON = {
          type: 'Feature',
          geometry: data.geometry,
          properties: data.properties || {}
        };
      }
      else {
        return { error: "Invalid GeoJSON format", geoJSON: null };
      }

      // Validate geometry types
      const validGeometryTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
      if (!normalizedGeoJSON.geometry || !validGeometryTypes.includes(normalizedGeoJSON.geometry.type)) {
        return { error: `Invalid geometry type: ${normalizedGeoJSON.geometry?.type || 'undefined'}`, geoJSON: null };
      }

      // Validate coordinates exist
      if (!normalizedGeoJSON.geometry.coordinates || !Array.isArray(normalizedGeoJSON.geometry.coordinates)) {
        return { error: "Invalid or missing coordinates", geoJSON: null };
      }

      // Basic coordinate validation
      const coords = normalizedGeoJSON.geometry.coordinates;
      if (normalizedGeoJSON.geometry.type === 'Point') {
        if (coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
          return { error: "Invalid Point coordinates", geoJSON: null };
        }
        // Check if coordinates are within valid ranges
        if (coords[0] < -180 || coords[0] > 180 || coords[1] < -90 || coords[1] > 90) {
          return { error: "Point coordinates out of valid range", geoJSON: null };
        }
      }

      return { error: null, geoJSON: normalizedGeoJSON };
    } catch (err) {
      return { error: `Error processing GeoJSON: ${err.message}`, geoJSON: null };
    }
  };

  // Function to calculate bounds from GeoJSON
  const calculateBounds = (geoJSON) => {
    if (!geoJSON || !geoJSON.geometry) return null;

    const { geometry } = geoJSON;
    let coordinates = [];

    try {
      if (geometry.type === 'Point') {
        coordinates = [geometry.coordinates];
      } else if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0];
      } else if (geometry.type === 'MultiPolygon') {
        coordinates = geometry.coordinates.flat(2);
      } else if (geometry.type === 'LineString') {
        coordinates = geometry.coordinates;
      } else if (geometry.type === 'MultiLineString') {
        coordinates = geometry.coordinates.flat();
      }

      if (coordinates.length === 0) return null;

      // Calculate min/max bounds
      let minLng = coordinates[0][0];
      let maxLng = coordinates[0][0];
      let minLat = coordinates[0][1];
      let maxLat = coordinates[0][1];

      coordinates.forEach(([lng, lat]) => {
        if (typeof lng === 'number' && typeof lat === 'number') {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      });

      return {
        southwest: [minLng, minLat],
        northeast: [maxLng, maxLat]
      };
    } catch (err) {
      console.error('Error calculating bounds:', err);
      return null;
    }
  };

  // Function to fit map to bounds
  const fitMapToBounds = (bounds) => {
    if (!bounds || !mapRef.current) return;

    try {
      const map = mapRef.current.getMap();
      
      if (bounds.southwest[0] === bounds.northeast[0] && bounds.southwest[1] === bounds.northeast[1]) {
        // Single point - center on it with appropriate zoom
        setViewState({
          longitude: bounds.southwest[0],
          latitude: bounds.southwest[1],
          zoom: 18
        });
      } else {
        // Multiple points - fit to bounds
        map.fitBounds([bounds.southwest, bounds.northeast], {
          padding: 30,
          maxZoom: 18,
          duration: 800
        });
      }
    } catch (err) {
      console.error('Error fitting map to bounds:', err);
    }
  };

  // Effect to handle geoJSON changes and validation
  useEffect(() => {
    console.log("Processing geoJSON update:", geoJSON);
    
    const { error: validationError, geoJSON: validatedGeoJSON } = validateAndNormalizeGeoJSON(geoJSON);
    
    if (validationError) {
      setError(validationError);
      setProcessedGeoJSON(null);
      console.error("GeoJSON validation error:", validationError);
    } else {
      setError(null);
      setProcessedGeoJSON(validatedGeoJSON);
      console.log("Processed GeoJSON:", validatedGeoJSON);
      
      // Calculate bounds and fit map
      if (validatedGeoJSON) {
        const bounds = calculateBounds(validatedGeoJSON);
        if (bounds) {
          // Small delay to ensure map is ready
          setTimeout(() => {
            fitMapToBounds(bounds);
          }, 100);
        }
      }
    }
  }, [geoJSON]);

  // Render point marker
  const renderPointMarker = (coordinates) => (
    <Marker
      key={`marker-${coordinates[0]}-${coordinates[1]}`}
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      anchor="bottom"
    >
      <div className="relative">
        <MapPin className="w-5 h-5 text-[#007A49] drop-shadow-sm" fill="currentColor" />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#007A49] rounded-full opacity-30"></div>
      </div>
    </Marker>
  );

  // Render polygon/line layers
  const renderGeometryLayers = () => {
    if (!processedGeoJSON || !processedGeoJSON.geometry) return null;

    const { geometry } = processedGeoJSON;

    try {
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        return (
          <Source key="geojson-source" id="geojson-source" type="geojson" data={processedGeoJSON}>
            <Layer
              id="geojson-fill"
              type="fill"
              paint={{
                'fill-color': '#007A49',
                'fill-opacity': 0.15
              }}
            />
            <Layer
              id="geojson-outline"
              type="line"
              paint={{
                'line-color': '#007A49',
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        );
      } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        return (
          <Source key="geojson-source" id="geojson-source" type="geojson" data={processedGeoJSON}>
            <Layer
              id="geojson-line"
              type="line"
              paint={{
                'line-color': '#007A49',
                'line-width': 3,
                'line-opacity': 0.8
              }}
            />
          </Source>
        );
      }
    } catch (err) {
      console.error('Error rendering geometry layers:', err);
    }

    return null;
  };

  // Get geometry info for display
  const getGeometryInfo = () => {
    if (!processedGeoJSON || !processedGeoJSON.geometry) return null;
    
    const { geometry } = processedGeoJSON;
    const type = geometry.type;
    
    let coordCount = 0;
    if (type === 'Point') {
      coordCount = 1;
    } else if (type === 'LineString') {
      coordCount = geometry.coordinates.length;
    } else if (type === 'Polygon') {
      coordCount = geometry.coordinates[0].length;
    }
    
    return { type, coordCount };
  };

  const geometryInfo = getGeometryInfo();

  return (
    <div className="relative w-full h-full bg-gray-100">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        scrollZoom={false}
        attributionControl={false}
      >
        {/* Compact navigation controls */}
        <div className="absolute bottom-2 right-2 bg-white rounded border border-gray-200 shadow-sm">
          <NavigationControl showCompass={false} />
        </div>

        {/* Compact GeolocateControl */}
        <div className="absolute bottom-14 right-2">
          <GeolocateControl
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={false}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>

        {/* Render GeoJSON data */}
        {processedGeoJSON && processedGeoJSON.geometry && (
          <>
            {/* Render point markers */}
            {processedGeoJSON.geometry.type === 'Point' && renderPointMarker(processedGeoJSON.geometry.coordinates)}
            
            {/* Render polygon/line layers */}
            {renderGeometryLayers()}
          </>
        )}
      </Map>

      {/* Info toggle button */}
      {geometryInfo && (
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Toggle geometry info"
        >
          <Info className="w-3.5 h-3.5 text-gray-600" />
        </button>
      )}

      {/* Geometry info panel */}
      {showInfo && geometryInfo && (
        <div className="absolute top-2 right-12 bg-white border border-gray-200 rounded shadow-sm p-2 text-xs">
          <div className="flex items-center space-x-1 mb-1">
            <Layers className="w-3 h-3 text-gray-500" />
            <span className="font-medium text-gray-700">Geometry</span>
          </div>
          <div className="text-gray-600">
            <div>Type: <span className="font-medium">{geometryInfo.type}</span></div>
            <div>Points: <span className="font-medium">{geometryInfo.coordCount}</span></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-2 left-2 bg-red-50 border border-red-200 text-red-700 p-2 rounded shadow-sm max-w-xs">
          <div className="flex items-center space-x-1 font-medium text-xs mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span>GeoJSON Error</span>
          </div>
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}

      {/* No data message */}
      {!geoJSON && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">No Location Data</div>
            <div className="text-xs text-gray-500">GeoJSON data will be displayed here</div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {geoJSON && !processedGeoJSON && !error && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-[#007A49]"></div>
              <span className="text-xs text-gray-600">Processing location data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapDisplayComponent;