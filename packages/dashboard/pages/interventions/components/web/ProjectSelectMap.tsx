import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  geoJSON: any; // GeoJSON data from parent
}

const MapDisplayComponent = ({ geoJSON }: Props) => {
  const mapRef = useRef();
  console.log("IUIUIUL",geoJSON)
  // Initial viewport settings
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3.5
  });

  // Function to calculate bounds from GeoJSON
  const calculateBounds = (geoJSON) => {
    if (!geoJSON || !geoJSON.geometry) return null;

    const { geometry } = geoJSON;
    let coordinates = [];

    if (geometry.type === 'Point') {
      coordinates = [geometry.coordinates];
    } else if (geometry.type === 'Polygon') {
      // Flatten the polygon coordinates
      coordinates = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      // Flatten all polygon coordinates
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
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return {
      southwest: [minLng, minLat],
      northeast: [maxLng, maxLat]
    };
  };

  // Function to fit map to bounds
  const fitMapToBounds = (bounds) => {
    if (!bounds || !mapRef.current) return;

    const map = mapRef.current.getMap();
    
    if (bounds.southwest[0] === bounds.northeast[0] && bounds.southwest[1] === bounds.northeast[1]) {
      // Single point - center on it with appropriate zoom
      setViewState({
        longitude: bounds.southwest[0],
        latitude: bounds.southwest[1],
        zoom: 10
      });
    } else {
      // Multiple points - fit to bounds
      map.fitBounds([bounds.southwest, bounds.northeast], {
        padding: 50,
        maxZoom: 15,
        duration: 1000
      });
    }
  };

  // Effect to handle geoJSON changes and camera updates
  useEffect(() => {
    if (geoJSON) {
      const bounds = calculateBounds(geoJSON);
      if (bounds) {
        // Small delay to ensure map is ready
        setTimeout(() => {
          fitMapToBounds(bounds);
        }, 100);
      }
    }
  }, [geoJSON]);

  // Render point marker
  const renderPointMarker = (coordinates) => (
    <Marker
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      anchor="bottom"
    >
      <MapPin color="#FF0000" size={24} />
    </Marker>
  );

  // Render polygon/line layers
  const renderGeometryLayers = () => {
    if (!geoJSON || !geoJSON.geometry) return null;

    const { geometry } = geoJSON;

    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      return (
        <Source id="geojson-source" type="geojson" data={geoJSON}>
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
        <Source id="geojson-source" type="geojson" data={geoJSON}>
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
        {geoJSON && geoJSON.geometry && (
          <>
            {/* Render point markers */}
            {geoJSON.geometry.type === 'Point' && renderPointMarker(geoJSON.geometry.coordinates)}
            
            {/* Render polygon/line layers */}
            {renderGeometryLayers()}
          </>
        )}
      </Map>

      {/* GeoJSON Info Display */}
      {geoJSON && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1,
          maxWidth: '300px'
        }}>
          <div className="text-sm">
            <div className="font-bold mb-2">GeoJSON Type: {geoJSON.geometry?.type}</div>
            {geoJSON.geometry?.type === 'Point' && (
              <div className="text-xs">
                <div>Lat: {geoJSON.geometry.coordinates[1].toFixed(6)}</div>
                <div>Lng: {geoJSON.geometry.coordinates[0].toFixed(6)}</div>
              </div>
            )}
            {(geoJSON.geometry?.type === 'Polygon' || geoJSON.geometry?.type === 'MultiPolygon') && (
              <div className="text-xs">
                Polygon with {geoJSON.geometry.type === 'Polygon' 
                  ? geoJSON.geometry.coordinates[0].length - 1 
                  : 'multiple'} vertices
              </div>
            )}
          </div>
        </div>
      )}

      {/* No data message */}
      {!geoJSON && (
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