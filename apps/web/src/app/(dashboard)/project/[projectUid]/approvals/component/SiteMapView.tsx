'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SiteMapViewProps {
  location: any; // GeoJSON geometry
  className?: string;
  markerInfo?: {
    title?: string;
    subtitle?: string;
  } | null;
}

export const SiteMapView: React.FC<SiteMapViewProps> = ({ location, className = '', markerInfo = null }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Calculate center from geometry
    const getCenter = (geometry: any): [number, number] => {
      if (geometry.type === 'Point') {
        return geometry.coordinates as [number, number];
      } else if (geometry.type === 'Polygon') {
        // Get center of first ring
        const coordinates = geometry.coordinates[0];
        const lngs = coordinates.map((c: number[]) => c[0]);
        const lats = coordinates.map((c: number[]) => c[1]);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        return [centerLng, centerLat];
      }
      return [0, 0];
    };

    const center = getCenter(location);

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: center,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);

      if (!map.current) return;

      // Add the site geometry source
      map.current.addSource('site-geometry', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: location,
        },
      });

      // Add polygon fill layer
      if (location.type === 'Polygon' || location.type === 'MultiPolygon') {
        map.current.addLayer({
          id: 'site-fill',
          type: 'fill',
          source: 'site-geometry',
          paint: {
            'fill-color': '#007A49',
            'fill-opacity': 0.3,
          },
        });

        // Add polygon outline
        map.current.addLayer({
          id: 'site-outline',
          type: 'line',
          source: 'site-geometry',
          paint: {
            'line-color': '#007A49',
            'line-width': 2,
          },
        });

        // Fit map to polygon bounds
        const coordinates = location.coordinates[0];
        const bounds = coordinates.reduce(
          (bounds: maplibregl.LngLatBounds, coord: number[]) => {
            return bounds.extend(coord as [number, number]);
          },
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        map.current.fitBounds(bounds, { padding: 50 });
      } else if (location.type === 'Point') {
        // Add marker for point
        const marker = new maplibregl.Marker({ color: '#007A49' })
          .setLngLat(location.coordinates as [number, number])
          .addTo(map.current);

        // If markerInfo is provided, attach a popup
        if (markerInfo && (markerInfo.title || markerInfo.subtitle)) {
          const popupHtml = `<div style="font-size:13px"><strong>${markerInfo.title || ''}</strong><div style="font-size:12px;color:#555">${markerInfo.subtitle || ''}</div></div>`;
          const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml);
          marker.setPopup(popup).togglePopup();
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [location]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-sm text-gray-500">Loading map...</div>
        </div>
      )}
    </div>
  );
};
