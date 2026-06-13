'use client';

import { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
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
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'esri-satellite-layer', type: 'raster' as const, source: 'esri-satellite' }],
};

const polygonLayer: any = {
  id: 'plot-fill',
  type: 'fill',
  paint: { 'fill-color': '#007A49', 'fill-opacity': 0.25 },
};

const polygonOutlineLayer: any = {
  id: 'plot-outline',
  type: 'line',
  paint: { 'line-color': '#007A49', 'line-width': 2.5 },
};

type Plant = {
  uid: string;
  tag?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  alive: '#16a34a',
  dead: '#dc2626',
  sick: '#d97706',
  removed: '#6b7280',
  unknown: '#9ca3af',
};

/**
 * Read-only map for a single monitoring plot: draws the plot boundary and
 * overlays each plant as a colored point. Mirrors DisplayGeoJSONMap's basemap
 * toggle and auto-fit, with plant markers added.
 */
const PlotMap = ({
  geometry,
  plants = [],
  height = '100%',
}: {
  geometry: any;
  plants?: Plant[];
  height?: string;
}) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const mapRef = useRef<any>(null);

  const points = plants.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number',
  );

  const fit = () => {
    if (!mapRef.current) return;
    try {
      const fitTarget =
        geometry ||
        (points.length
          ? turf.featureCollection(points.map((p) => turf.point([p.longitude as number, p.latitude as number])))
          : null);
      if (!fitTarget) return;
      const [minLng, minLat, maxLng, maxLat] = turf.bbox(fitTarget);
      const center = turf.center(fitTarget).geometry.coordinates;
      const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);
      const zoom =
        maxDiff > 0.1 ? 9 : maxDiff > 0.02 ? 13 : maxDiff > 0.005 ? 15 : 17;
      setTimeout(() => {
        mapRef.current?.flyTo({ center, zoom, duration: 1200, essential: true });
      }, 100);
    } catch {
      // bbox can throw on empty/invalid geometry; leave the default view.
    }
  };

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, plants]);

  if (mapError) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-muted border border-dashed rounded-lg"
        style={{ width: '100%', height }}
      >
        <AlertTriangle className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border" style={{ height }}>
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isSatellite ? (SATELLITE_STYLE as any) : STREET_STYLE}
        attributionControl={false}
        reuseMaps
        onLoad={fit}
        onError={(e: any) => setMapError(e?.error?.message || 'Failed to load map')}
        initialViewState={{ longitude: -90.135, latitude: 18.68, zoom: 12 }}
      >
        {geometry && (
          <Source id="plot-source" type="geojson" data={geometry} key={JSON.stringify(geometry)}>
            <Layer {...polygonLayer} />
            <Layer {...polygonOutlineLayer} />
          </Source>
        )}
        {points.map((p) => (
          <Marker key={p.uid} longitude={p.longitude as number} latitude={p.latitude as number}>
            <span
              title={p.tag || p.status || 'plant'}
              className="block w-2.5 h-2.5 rounded-full border border-white shadow"
              style={{ backgroundColor: STATUS_COLOR[(p.status || 'unknown').toLowerCase()] || STATUS_COLOR.unknown }}
            />
          </Marker>
        ))}
      </Map>

      <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
        {isSatellite ? '© Esri' : '© CartoDB'}
      </div>
      <button
        onClick={() => setIsSatellite((v) => !v)}
        className="absolute top-2 right-2 bg-white/90 hover:bg-white px-3 py-1.5 rounded shadow text-xs font-medium text-gray-700 transition"
      >
        {isSatellite ? 'Map' : 'Satellite'}
      </button>
    </div>
  );
};

export default PlotMap;
