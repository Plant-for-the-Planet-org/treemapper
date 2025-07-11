'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { AlertTriangle, MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

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
  const [isValidGeoJson, setIsValidGeoJson] = useState(true);
  const mapRef = useRef();
  const prevGeoJsonRef = useRef();

  // Calculate bounds for the polygon to fit the view
  const calculateBounds = useCallback((geoJson) => {
    try {
      if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
        return initialViewState;
      }

      // Get the bounding box of the feature collection
      const bbox = turf.bbox(geoJson);
      const [minLng, minLat, maxLng, maxLat] = bbox;

      // Calculate center point
      const center = turf.center(geoJson);
      const [longitude, latitude] = center.geometry.coordinates;

      // Calculate appropriate zoom level based on bounding box size
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);

      // Rough zoom calculation (you can adjust this formula)
      let zoom = 13;
      if (maxDiff > 0.1) zoom = 10;
      else if (maxDiff > 0.05) zoom = 11;
      else if (maxDiff > 0.02) zoom = 12;
      else if (maxDiff > 0.01) zoom = 13;
      else if (maxDiff > 0.005) zoom = 14;
      else zoom = 15;

      return {
        longitude,
        latitude,
        zoom
      };
    } catch (error) {
      console.error('Error calculating bounds with Turf:', error);
      return initialViewState;
    }
  }, [initialViewState]);

  // Update map view when geoJSON changes
  useEffect(() => {

    prevGeoJsonRef.current = geoJsonData;

  }, [geoJsonData, calculateBounds]);

  // Validate GeoJSON data
  useEffect(() => {
    if (geoJsonData) {
      try {
        // Basic validation - check if it's a valid GeoJSON structure
        if (geoJsonData.type && (geoJsonData.type === 'FeatureCollection' || geoJsonData.type === 'Feature')) {
          setIsValidGeoJson(true);
        } else {
          setIsValidGeoJson(false);
        }
      } catch (error) {
        console.error('Invalid GeoJSON:', error);
        setIsValidGeoJson(false);
      }
    } else {
      setIsValidGeoJson(true); // Allow null/undefined geoJSON
    }
  }, [geoJsonData]);

  // Layer styles
  const polygonLayer = {
    id: 'polygon-fill',
    type: 'fill',
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.3
    }
  };

  const polygonOutlineLayer = {
    id: 'polygon-outline',
    type: 'line',
    paint: {
      'line-color': '#1d4ed8',
      'line-width': 2
    }
  };

  const handleMapError = useCallback((error) => {
    console.error('Map error:', error);
    setMapError(error.message || 'Failed to load map');
  }, []);

  // Error placeholder component
  const ErrorPlaceholder = ({ message }) => (
    <div
      className="flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg"
      style={{ width, height }}
    >
      <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">Map Unavailable</h3>
      <p className="text-gray-500 text-center max-w-sm">
        {message || 'Unable to display map due to invalid data or configuration'}
      </p>
    </div>
  );

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div
      className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg"
      style={{ width, height }}
    >
      <MapPin className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
      <p className="text-gray-600">Loading map...</p>
    </div>
  );

  // Show error placeholder if GeoJSON is invalid
  if (!isValidGeoJson && geoJsonData) {
    return <ErrorPlaceholder message="Invalid GeoJSON data provided" />;
  }

  // Show error placeholder if map failed to load
  if (mapError) {
    return <ErrorPlaceholder message={mapError} />;
  }

  // Calculate initial view state only if geoJSON exists
  const currentViewState = geoJsonData ? calculateBounds(geoJsonData) : initialViewState;

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '40vh' }}
        initialViewState={currentViewState}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        attributionControl={false}
        reuseMaps
      >
        {geoJsonData && (
          <Source id="polygon-source" type="geojson" data={geoJsonData}>
            <Layer {...polygonLayer} />
            <Layer {...polygonOutlineLayer} />
          </Source>
        )}
      </Map>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
        © CartoDB
      </div>
    </div>
  );
};

export default MapComponent;