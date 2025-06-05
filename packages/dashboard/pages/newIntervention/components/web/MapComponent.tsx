import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapComponent = ({ geoJSON, onFeatureClick }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Generate a random polygon if no geoJSON is provided
  const generateRandomPolygon = () => {
    // Center point (roughly central India)
    const centerLng = 78.9629;
    const centerLat = 20.5937;

    // Create random points around the center
    const points = [];
    const numPoints = 5;
    const radius = 1; // degrees

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const lng = centerLng + Math.cos(angle) * radius * Math.random();
      const lat = centerLat + Math.sin(angle) * radius * Math.random();
      points.push([lng, lat]);
    }

    // Close the polygon by adding the first point again
    points.push([...points[0]]);

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "random-polygon",
            name: "Random Polygon"
          },
          geometry: {
            type: "Polygon",
            coordinates: [points]
          }
        }
      ]
    };
  };

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              // tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tiles: ['https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: '© OpenStreetMap Contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [78.9629, 20.5937], // Center on India
        zoom: 4
      });

      // Add navigation controls
      mapRef.current.addControl(new maplibregl.NavigationControl());

      // Setup map loaded event
      mapRef.current.on('load', () => {
        // Map is ready for data
        updateMapData();
      });
    } else if (mapRef.current) {
      // Map already exists, update data
      updateMapData();
    }

    return () => {
      // Cleanup map instance when component unmounts
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geoJSON]);

  const updateMapData = () => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    // Remove previous sources and layers if they exist
    if (map.getSource('geojson-data')) {
      map.removeLayer('geojson-fills');
      map.removeLayer('geojson-outlines');
      map.removeLayer('geojson-points');
      map.removeSource('geojson-data');
    }

    // Use provided geoJSON or generate random polygon
    const data = geoJSON || generateRandomPolygon();

    // Add the GeoJSON source
    map.addSource('geojson-data', {
      type: 'geojson',
      data: data
    });

    // Add fill layer
    map.addLayer({
      id: 'geojson-fills',
      type: 'fill',
      source: 'geojson-data',
      paint: {
        'fill-color': '#007A49',
        'fill-opacity': 0.5
      },
      filter: ['!=', ['geometry-type'], 'Point']
    });

    // Add outline layer
    map.addLayer({
      id: 'geojson-outlines',
      type: 'line',
      source: 'geojson-data',
      paint: {
        'line-color': '#fff',
        'line-width': 2
      },
      filter: ['!=', ['geometry-type'], 'Point']
    });

    // Add point layer
    map.addLayer({
      id: 'geojson-points',
      type: 'circle',
      source: 'geojson-data',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff0000'
      },
      filter: ['==', ['geometry-type'], 'Point']
    });

    // Fit map to GeoJSON bounds
    if (data && data.features && data.features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();

      data.features.forEach(feature => {
        if (feature.geometry.type === 'Point') {
          bounds.extend(feature.geometry.coordinates);
        } else if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach(coord => {
            bounds.extend(coord);
          });
        } else if (feature.geometry.type === 'LineString') {
          feature.geometry.coordinates.forEach(coord => {
            bounds.extend(coord);
          });
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }

    // Add click handler for features
    if (geoJSON) {
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['geojson-fills', 'geojson-points']
        });

        if (features.length > 0) {
          const clickedFeature = features[0];
          setSelectedFeature(clickedFeature);

          // Call the provided click handler if available
          if (onFeatureClick) {
            onFeatureClick(clickedFeature);
          }

          // Create popup
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <h3 class="font-bold">${clickedFeature.properties.name || clickedFeature.properties.id || 'Feature'}</h3>
              <p>${JSON.stringify(clickedFeature.properties, null, 2)}</p>
            `)
            .addTo(map);
        }
      });

      // Change cursor to pointer when hovering over features
      map.on('mouseenter', 'geojson-fills', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'geojson-fills', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('mouseenter', 'geojson-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'geojson-points', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
      />

      {!geoJSON && (
        <div className="absolute bottom-2 left-2 right-2 bg-white p-2 rounded text-xs text-gray-800">
          Displaying site map for "Site A"
        </div>
      )}

      {selectedFeature && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded shadow text-xs max-w-xs">
          <h3 className="font-bold">Selected Feature</h3>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(selectedFeature.properties, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MapComponent;