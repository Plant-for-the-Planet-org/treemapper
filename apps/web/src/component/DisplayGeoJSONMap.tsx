'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { AlertTriangle } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

const STREET_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    'esri-satellite': {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri'
    }
  },
  layers: [{ id: 'esri-satellite-layer', type: 'raster' as const, source: 'esri-satellite' }]
};

const MapComponent = ({
  geoJsonData,
  width = '100%',
  height = '100%',
  initialViewState = {
    longitude: -90.135,
    latitude: 18.68,
    zoom: 12
  }
}) => {
  const [mapError, setMapError] = useState(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const mapRef = useRef();

  useEffect(() => {
   handleFly()
  }, [geoJsonData]);
  const handleFly=()=>{
     if (!geoJsonData || !mapRef.current) return;
    console.log('GeoJSON data received:', geoJsonData);
    try {
      // Get bounds and center using Turf.js
      const bounds = turf.bbox(geoJsonData);
      const [minLng, minLat, maxLng, maxLat] = bounds;
      const center = turf.center(geoJsonData);
      const [longitude, latitude] = center.geometry.coordinates;

      // Calculate zoom based on bounding box size
      const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);

      const zoom = maxDiff > 0.1 ? 8 :
        maxDiff > 0.05 ? 10 :
          maxDiff > 0.02 ? 12 :
            maxDiff > 0.01 ? 13 :
              maxDiff > 0.005 ? 14 : 15;

      // Fly to new location
      setTimeout(() => {
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom,
          duration: 1500,
          essential: true
        });
      }, 100);

    } catch (error) {
      console.error('Error calculating bounds with Turf:', error);
    }
  }

  // Layer styles
  const polygonLayer = {
    id: 'polygon-fill',
    type: 'fill',
    paint: {
      'fill-color': '#007A49',
      'fill-opacity': 0.4
    }
  };

  const polygonOutlineLayer = {
    id: 'polygon-outline',
    type: 'line',
    paint: {
      'line-color': '#007A49',
      'line-width': 3
    }
  };

  const handleMapError = useCallback((error) => {
    console.error('Map error:', error);
    setMapError(error.message || 'Failed to load map');
  }, []);

  // Error placeholder
  if (mapError) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg"
        style={{ width: '100%', height: '100%' }}
      >
        <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Map Unavailable</h3>
        <p className="text-gray-500 text-center max-w-sm">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isSatellite ? SATELLITE_STYLE : STREET_STYLE}
        attributionControl={false}
        onError={handleMapError}
        reuseMaps
        onLoad={handleFly}
      >
        {geoJsonData && (
          <Source
            id="polygon-source"
            type="geojson"
            data={geoJsonData}
            key={JSON.stringify(geoJsonData)}
          >
            <Layer {...polygonLayer} />
            <Layer {...polygonOutlineLayer} />
          </Source>
        )}
      </Map>

      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
        {isSatellite ? '© Esri' : '© CartoDB'}
      </div>

      <button
        onClick={() => setIsSatellite(prev => !prev)}
        className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 px-3 py-1.5 rounded shadow text-xs font-medium text-gray-700 transition"
      >
        {isSatellite ? 'Map' : 'Satellite'}
      </button>
    </div>
  );
};

export default MapComponent;