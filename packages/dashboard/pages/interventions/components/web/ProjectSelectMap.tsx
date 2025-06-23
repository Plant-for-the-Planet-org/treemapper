import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  geoJSON: any; // GeoJSON data or geometry from parent
}

const MapDisplayComponent = ({ geoJSON }: Props) => {
  const mapRef = useRef();
  const [error, setError] = useState(null);
  const [processedGeoJSON, setProcessedGeoJSON] = useState(null);
  
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
          padding: 50,
          maxZoom: 18,
          duration: 1000
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
      <MapPin color="#FF0000" size={24} />
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
                'fill-color': '#0080ff',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="geojson-outline"
              type="line"
              paint={{
                'line-color': '#0080ff',
                'line-width': 2
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
                'line-color': '#0080ff',
                'line-width': 3
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        scrollZoom={false}
      >
        {/* Default navigation controls */}
        <NavigationControl position="bottom-right" />

        {/* GeolocateControl */}
        <GeolocateControl
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />

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

      {/* Error Display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxWidth: '350px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ GeoJSON Error</div>
          <div>{error}</div>
        </div>
      )}

      {/* GeoJSON Info Display */}


      {/* No data message */}
      {!geoJSON && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1,
          textAlign: 'center'
        }}>
          <div className="text-gray-500">
            No GeoJSON data to display
          </div>
        </div>
      )}
    </div>
  );
};

export default MapDisplayComponent;